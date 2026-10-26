//! Panchang days at a place: sunrise, the tithi at sunrise (udaya tithi), and
//! the civil date each occurrence of a tithi is assigned to.

use std::fmt;

use chrono::{DateTime, Days, NaiveDate, TimeZone};
use chrono_tz::Tz;

use crate::sun;
use crate::table::{Table, TithiSpan};

#[derive(Clone, Debug)]
pub struct Place {
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub tz: Tz,
}

impl Place {
    pub fn local(&self, unix: i64) -> DateTime<Tz> {
        self.tz.timestamp_opt(unix, 0).unwrap()
    }
}

#[derive(Debug, PartialEq)]
pub enum Error {
    OutOfRange,
    NoSunrise(NaiveDate),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::OutOfRange => write!(f, "outside the supported years 1900-2149"),
            Error::NoSunrise(d) => write!(f, "the Sun does not rise on {d} at this latitude"),
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
