//! Panchang days at a place: sunrise, the tithi at sunrise (udaya tithi), and
//! the civil date each occurrence of a tithi is assigned to.

use std::fmt;

use chrono::{DateTime, Datelike, Days, LocalResult, NaiveDate, NaiveDateTime, NaiveTime, TimeZone, Timelike};
use chrono_tz::Tz;

use crate::sun;
use crate::table::{Table, TithiSpan};

/// The Gregorian years the table fully covers.
pub const FIRST_YEAR: i32 = 1900;
pub const LAST_YEAR: i32 = 2149;

#[derive(Clone, Debug)]
pub struct Place {
    /// Empty for a place given only by coordinates.
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub tz: Tz,
}

impl Place {
    /// A place given by coordinates and an IANA time zone name.
    pub fn from_coordinates(lat: f64, lon: f64, tz: &str) -> Result<Place, String> {
        if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lon) {
            return Err("latitude must be -90..90 and longitude -180..180".to_string());
        }
        let tz = tz
            .parse()
            .map_err(|_| format!("unknown time zone {tz:?}; use an IANA name such as Asia/Kolkata"))?;
        Ok(Place { name: String::new(), lat, lon, tz })
    }

    pub fn local(&self, unix: i64) -> DateTime<Tz> {
        self.tz.timestamp_opt(unix, 0).unwrap()
    }
}

#[derive(Debug, PartialEq)]
pub enum Error {
    OutOfRange,
    NoSunrise(NaiveDate),
    /// A wall-clock time skipped when clocks went forward.
    NoSuchTime(NaiveDateTime, Tz),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::OutOfRange => write!(f, "outside the supported years {FIRST_YEAR}-{LAST_YEAR}"),
            Error::NoSunrise(d) => write!(f, "the Sun does not rise on {d} at this latitude"),
            Error::NoSuchTime(dt, tz) => write!(f, "{dt} never happened in {tz} (clocks went forward)"),
        }
    }
}

impl std::error::Error for Error {}

/// How one occurrence of a tithi maps onto sunrise-to-sunrise days.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DayKind {
    /// Exactly one sunrise falls inside the tithi.
    Normal,
    /// No sunrise falls inside (kshaya); the date is the day the tithi falls in.
    Kshaya,
    /// Two sunrises fall inside (vriddhi); the date is the first, this is the second.
    Vriddhi(NaiveDate),
}

#[derive(Clone, Copy, Debug)]
pub struct Occurrence {
    pub span: TithiSpan,
    pub date: NaiveDate,
    pub kind: DayKind,
}

/// A local wall-clock time as civil Unix seconds. The flag is set when clocks
/// went back and the time happened twice; the first one is used.
pub fn local_moment(place: &Place, date: NaiveDate, time: NaiveTime) -> Result<(i64, bool), Error> {
    match place.tz.from_local_datetime(&date.and_time(time)) {
        LocalResult::Single(dt) => Ok((dt.timestamp(), false)),
        LocalResult::Ambiguous(first, _) => Ok((first.timestamp(), true)),
        LocalResult::None => Err(Error::NoSuchTime(date.and_time(time), place.tz)),
    }
}

/// Parses HH:MM or HH:MM:SS, 24-hour or with am/pm.
pub fn parse_time(s: &str) -> Result<NaiveTime, String> {
    let lower = s.trim().to_ascii_lowercase();
    let (clock, pm) = match (lower.strip_suffix("pm"), lower.strip_suffix("am")) {
        (Some(c), _) => (c.trim(), Some(true)),
        (_, Some(c)) => (c.trim(), Some(false)),
        _ => (lower.as_str(), None),
    };
    let err = || format!("expected a time like 06:30 or 06:30:15, got {s:?}");
    let t = NaiveTime::parse_from_str(clock, "%H:%M:%S")
        .or_else(|_| NaiveTime::parse_from_str(clock, "%H:%M"))
        .map_err(|_| err())?;
    match pm {
        None => Ok(t),
        Some(_) if t.hour() == 0 || t.hour() > 12 => Err(err()),
        Some(pm) => Ok(t.with_hour(t.hour() % 12 + if pm { 12 } else { 0 }).unwrap()),
    }
}

/// Every date tithi `index` falls on at `place` in Gregorian years
/// `from..=to`. With `month`, only occurrences in that amanta month (the
/// regular one, never the adhika one): one a year.
pub fn list_dates(
    table: &Table,
    place: &Place,
    index: usize,
    month: Option<usize>,
    from: i32,
    to: i32,
) -> Result<Vec<Occurrence>, Error> {
    let year_start = |y: i32| {
        place.tz.with_ymd_and_hms(y, 1, 1, 0, 0, 0).earliest().map(|d| d.timestamp()).ok_or(Error::OutOfRange)
    };
    let margin = 3 * 86400;
    let mut dates = Vec::new();
    for span in table.occurrences(index, year_start(from)? - margin, year_start(to + 1)? + margin) {
        if let Some(m) = month
            && !table.masa_at(span.start).is_some_and(|x| x.index == m && !x.adhika)
        {
            continue;
        }
        let occ = assign_date(table, place, span)?;
        if (from..=to).contains(&occ.date.year()) {
            dates.push(occ);
        }
    }
    Ok(dates)
}

/// Sunrise on local date `date` at `place`, in civil Unix seconds.
pub fn sunrise(table: &Table, place: &Place, date: NaiveDate) -> Result<i64, Error> {
    let mut day = date;
    for _ in 0..3 {
        let midnight = day.and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp() as f64;
        // 06:00 local mean solar time is within a few hours of sunrise wherever it rises.
        let guess = midnight + 6.0 * 3600.0 - place.lon / 15.0 * 3600.0;
        let ut1 = sun::sunrise_near(place.lat, place.lon, guess + table.ut1_minus_civil(guess))
            .ok_or(Error::NoSunrise(date))?;
        let civil = (ut1 - table.ut1_minus_civil(ut1)).round() as i64;
        let got = place.local(civil).date_naive();
        if got == date {
            return Ok(civil);
        }
        // A zone far from solar time can put that sunrise on a neighbouring date.
        day = if got < date { day + Days::new(1) } else { day - Days::new(1) };
    }
    Err(Error::NoSunrise(date))
}

/// The tithi in effect at sunrise on `date`, with that sunrise.
pub fn udaya_tithi(table: &Table, place: &Place, date: NaiveDate) -> Result<(i64, TithiSpan), Error> {
    let sr = sunrise(table, place, date)?;
    Ok((sr, table.tithi_at(sr).ok_or(Error::OutOfRange)?))
}

/// The panchang day (sunrise to sunrise) containing `unix`: its civil date and sunrise.
pub fn panchang_day(table: &Table, place: &Place, unix: i64) -> Result<(NaiveDate, i64), Error> {
    let date = place.local(unix).date_naive();
    let sr = sunrise(table, place, date)?;
    if unix >= sr {
        return Ok((date, sr));
    }
    let previous = date - Days::new(1);
    Ok((previous, sunrise(table, place, previous)?))
}

/// The civil date an occurrence of a tithi is observed on: the day whose
/// sunrise falls inside it.
pub fn assign_date(table: &Table, place: &Place, span: TithiSpan) -> Result<Occurrence, Error> {
    let first = place.local(span.start).date_naive();
    let mut inside = Vec::with_capacity(2);
    for offset in 0..3 {
        let day = first + Days::new(offset);
        let sr = sunrise(table, place, day)?;
        if sr >= span.end {
            break;
        }
        if sr >= span.start {
            inside.push(day);
        }
    }
    let (date, kind) = match inside.as_slice() {
        [day] => (*day, DayKind::Normal),
        [day, second, ..] => (*day, DayKind::Vriddhi(*second)),
        [] => {
            let day = if sunrise(table, place, first)? <= span.start { first } else { first - Days::new(1) };
            (day, DayKind::Kshaya)
        }
    };
    Ok(Occurrence { span, date, kind })
}
