use std::error::Error;
use std::process::ExitCode;

use chrono::{Datelike, LocalResult, NaiveDate, NaiveTime, TimeZone, Timelike, Utc};
use chrono_tz::Tz;
use clap::{ArgGroup, Args, Parser, Subcommand};

use tithi::names::{self, masa_name, paksha, purnimanta_name, tithi_name};
use tithi::panchang::{self, DayKind, Occurrence, Place};
use tithi::places::{self, PLACES};
use tithi::table::Table;

type Res = Result<(), Box<dyn Error>>;

const FIRST_YEAR: i32 = 1900;
const LAST_YEAR: i32 = 2149;

#[derive(Parser)]
#[command(
    name = "tithi",
    version,
    about = "Tithi for a moment and place, and the dates a tithi falls on.",
    long_about = "Tithi for a moment and place, and the dates a tithi falls on.\n\n\
        Drik method: JPL DE440 Sun and Moon positions, Lahiri ayanamsa, amanta months, \
        sunrise when the Sun's upper edge clears the horizon (with refraction). \
        A date gets the tithi in effect at its sunrise. Covers 1900-2149."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Show the tithi at a moment, or at sunrise if --time is left out
    At {
        /// Local date, YYYY-MM-DD
        #[arg(long)]
        date: NaiveDate,
        /// Local time, HH:MM or HH:MM:SS (24-hour, or with am/pm)
        #[arg(long, value_parser = parse_time)]
        time: Option<NaiveTime>,
        #[command(flatten)]
        place: PlaceArgs,
    },
    /// List the dates a tithi falls on at a place
    #[command(group(ArgGroup::new("what").required(true).args(["tithi", "date"])))]
    Dates {
        /// Tithi to look for: "Shukla Tritiya", "Krishna 8", "Purnima", or 1-30
        #[arg(long)]
        tithi: Option<String>,
        /// Only in this lunar month (amanta, the regular not the adhika one), e.g. Pausha
        #[arg(long, requires = "tithi")]
        month: Option<String>,
        /// Birth date, YYYY-MM-DD: look for the tithi in effect at birth
        #[arg(long, requires = "time")]
        date: Option<NaiveDate>,
        /// Birth time, HH:MM or HH:MM:SS
        #[arg(long, requires = "date", value_parser = parse_time)]
        time: Option<NaiveTime>,
        /// With a birth date: only in the birth lunar month, one date a year (tithi birthday)
        #[arg(long, requires = "date")]
        yearly: bool,
        /// First Gregorian year [default: the year after birth, or this year]
        #[arg(long)]
        from: Option<i32>,
        /// Last Gregorian year [default: 100 years after birth, or --from]
        #[arg(long)]
        to: Option<i32>,
        /// Print CSV instead of a table
        #[arg(long)]
        csv: bool,
        #[command(flatten)]
        place: PlaceArgs,
    },
    /// List the built-in places
    Places,
}

#[derive(Args)]
struct PlaceArgs {
    /// Built-in place, e.g. delhi, mumbai, london (see `tithi places`)
    #[arg(long, required_unless_present = "lat", conflicts_with_all = ["lat", "lon", "tz"])]
    place: Option<String>,
    /// Latitude in degrees, north positive
    #[arg(long, allow_hyphen_values = true, requires_all = ["lon", "tz"])]
    lat: Option<f64>,
    /// Longitude in degrees, east positive
    #[arg(long, allow_hyphen_values = true, requires_all = ["lat", "tz"])]
    lon: Option<f64>,
    /// IANA time zone for --lat/--lon, e.g. Asia/Kolkata
    #[arg(long, requires_all = ["lat", "lon"])]
    tz: Option<String>,
}

impl PlaceArgs {
    fn resolve(&self) -> Result<Place, Box<dyn Error>> {
        if let Some(query) = &self.place {
            let p = places::find(query).ok_or_else(|| {
                format!("unknown place {query:?}; run `tithi places`, or pass --lat, --lon and --tz")
            })?;
            return Ok(Place { name: p.name.to_string(), lat: p.lat, lon: p.lon, tz: p.tz.parse()? });
        }
        let (lat, lon, tz) = (self.lat.unwrap(), self.lon.unwrap(), self.tz.as_deref().unwrap());
        if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lon) {
            return Err("latitude must be -90..90 and longitude -180..180".into());
        }
        let tz: Tz = tz
            .parse()
            .map_err(|_| format!("unknown time zone {tz:?}; use an IANA name such as Asia/Kolkata"))?;
        Ok(Place { name: String::new(), lat, lon, tz })
    }
}

fn main() -> ExitCode {
    let result = match Cli::parse().command {
        Command::At { date, time, place } => at(date, time, &place),
        Command::Dates { tithi, month, date, time, yearly, from, to, csv, place } => {
            let birth = date.zip(time);
            dates(tithi, month, birth, yearly, from, to, csv, &place)
        }
        Command::Places => {
            list_places();
            Ok(())
        }
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e}");
            ExitCode::FAILURE
        }
    }
}

fn at(date: NaiveDate, time: Option<NaiveTime>, place: &PlaceArgs) -> Res {
    let table = Table::embedded();
    let place = place.resolve()?;
    let moment = match time {
        Some(t) => local_moment(&place, date, t)?,
        None => panchang::sunrise(table, &place, date)?,
    };
    let span = table.tithi_at(moment).ok_or(panchang::Error::OutOfRange)?;
    let masa = table.masa_at(moment).ok_or(panchang::Error::OutOfRange)?;
    let full = |unix: i64| place.local(unix).format("%Y-%m-%d %H:%M:%S %Z").to_string();

    println!("Place         {}", describe(&place));
    if time.is_some() {
        println!("Moment        {}  ({} UTC)", full(moment), Utc.timestamp_opt(moment, 0).unwrap().format("%Y-%m-%d %H:%M:%S"));
    } else {
        println!("Sunrise       {}", full(moment));
    }
    println!("Tithi         {}  ({} of 30, {} paksha)", tithi_name(span.index), span.index + 1, paksha(span.index));
    println!("  begins      {}", full(span.start));
    println!("  ends        {}", full(span.end));
    let purnimanta = purnimanta_name(masa, span.index);
    if purnimanta == masa_name(masa) {
        println!("Lunar month   {}", masa_name(masa));
    } else {
        println!("Lunar month   {} (amanta) / {} (purnimanta)", masa_name(masa), purnimanta);
    }

    if time.is_some() {
        let (day, sunrise) = panchang::panchang_day(table, &place, moment)?;
        let udaya = table.tithi_at(sunrise).ok_or(panchang::Error::OutOfRange)?;
        println!("Panchang day  {} {}, from sunrise at {}", day, day.format("%a"), place.local(sunrise).format("%H:%M:%S"));
        println!("  udaya tithi {}  (the tithi at that sunrise, which names the day)", tithi_name(udaya.index));
        if day != date {
            println!("  note        before sunrise, so this moment belongs to the previous panchang day");
        }
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn dates(
    tithi: Option<String>,
    month: Option<String>,
    birth: Option<(NaiveDate, NaiveTime)>,
    yearly: bool,
    from: Option<i32>,
    to: Option<i32>,
    csv: bool,
    place: &PlaceArgs,
) -> Res {
    let table = Table::embedded();
    let place = place.resolve()?;
    let mut notes = Vec::new();

    let (target, month, from, to) = match (tithi, birth) {
        (Some(t), _) => {
            let target = names::parse_tithi(&t)?;
            let month = month.map(|m| names::parse_masa(&m)).transpose()?;
            let from = from.unwrap_or_else(|| Utc::now().year());
            (target, month, from, to.unwrap_or(from))
        }
        (None, Some((date, time))) => {
            let moment = local_moment(&place, date, time)?;
            let span = table.tithi_at(moment).ok_or(panchang::Error::OutOfRange)?;
            let masa = table.masa_at(moment).ok_or(panchang::Error::OutOfRange)?;
            if !csv {
                println!("Born          {}", place.local(moment).format("%Y-%m-%d %H:%M:%S %Z"));
                println!("Birth tithi   {} in {} (amanta)", tithi_name(span.index), masa_name(masa));
            }
            if yearly && masa.adhika {
                notes.push(format!("born in an adhika month; listing the regular {} each year", names::MASAS[masa.index]));
            }
            let from = from.unwrap_or(date.year() + 1);
            (span.index, yearly.then_some(masa.index), from, to.unwrap_or(date.year() + 100))
        }
        (None, None) => unreachable!("clap requires --tithi or --date"),
    };

    if from < FIRST_YEAR || to > LAST_YEAR {
        notes.push(format!("the data covers {FIRST_YEAR}-{LAST_YEAR}; years outside it are left out"));
    }
    let (from, to) = (from.max(FIRST_YEAR), to.min(LAST_YEAR));
    if from > to {
        return Err(format!("no years to list; the data covers {FIRST_YEAR}-{LAST_YEAR}").into());
    }
    let year_start = |y: i32| place.tz.with_ymd_and_hms(y, 1, 1, 0, 0, 0).earliest().unwrap().timestamp();
    let margin = 3 * 86400;
    let mut occurrences = Vec::new();
    for span in table.occurrences(target, year_start(from) - margin, year_start(to + 1) + margin) {
        if let Some(m) = month
            && !table.masa_at(span.start).is_some_and(|x| x.index == m && !x.adhika)
        {
            continue;
        }
        let occ = panchang::assign_date(table, &place, span)?;
        if (from..=to).contains(&occ.date.year()) {
            occurrences.push(occ);
        }
    }

    if csv {
        for note in &notes {
            eprintln!("note: {note}");
        }
        print_csv(table, &place, &occurrences);
    } else {
        let scope = match month {
            Some(m) => format!("in {}, once a year", names::MASAS[m]),
            None => "every occurrence".to_string(),
        };
        let years = if from == to { from.to_string() } else { format!("{from}-{to}") };
        println!("Listing       {} {}, {}", tithi_name(target), scope, years);
        println!("Place         {}", describe(&place));
        for note in &notes {
            println!("Note          {note}");
        }
        println!();
        print_table(table, &place, &occurrences);
    }
    Ok(())
}

fn print_table(table: &Table, place: &Place, occurrences: &[Occurrence]) {
    println!("{:<10}  {:<3}  {:<20}  {:<16}  {:<16}  Note", "Date", "Day", "Month (amanta)", "Tithi begins", "Tithi ends");
    let short = |unix: i64| place.local(unix).format("%Y-%m-%d %H:%M").to_string();
    let (mut kshaya, mut vriddhi) = (0, 0);
    for occ in occurrences {
        let month = table.masa_at(occ.span.start).map(masa_name).unwrap_or_default();
        let note = match occ.kind {
            DayKind::Normal => String::new(),
            DayKind::Kshaya => {
                kshaya += 1;
                "kshaya: no sunrise inside; the day it falls in".to_string()
            }
            DayKind::Vriddhi(second) => {
                vriddhi += 1;
                format!("vriddhi: also at sunrise on {second}")
            }
        };
        println!(
            "{}  {}  {:<20}  {}  {}  {}",
            occ.date,
            occ.date.format("%a"),
            month,
            short(occ.span.start),
            short(occ.span.end),
            note
        );
    }
    println!();
    println!("{} dates ({kshaya} kshaya, {vriddhi} vriddhi). Each date is the day whose sunrise falls inside the tithi.", occurrences.len());
}

fn print_csv(table: &Table, place: &Place, occurrences: &[Occurrence]) {
    println!("date,weekday,tithi,month,adhika,begins,ends,kind,also");
    let iso = |unix: i64| place.local(unix).format("%Y-%m-%dT%H:%M:%S%:z").to_string();
    for occ in occurrences {
        let masa = table.masa_at(occ.span.start);
        let (kind, also) = match occ.kind {
            DayKind::Normal => ("normal", String::new()),
            DayKind::Kshaya => ("kshaya", String::new()),
            DayKind::Vriddhi(second) => ("vriddhi", second.to_string()),
        };
        println!(
            "{},{},{},{},{},{},{},{},{}",
            occ.date,
            occ.date.format("%a"),
            tithi_name(occ.span.index),
            masa.map(|m| names::MASAS[m.index]).unwrap_or_default(),
            masa.is_some_and(|m| m.adhika),
            iso(occ.span.start),
            iso(occ.span.end),
            kind,
            also
        );
    }
}

fn list_places() {
    println!("{:<20}  {:>9}  {:>10}  {:<20}  Also", "Place", "Lat", "Lon", "Time zone");
    for p in PLACES {
        println!("{:<20}  {:>9.4}  {:>10.4}  {:<20}  {}", p.name, p.lat, p.lon, p.tz, p.aliases.join(", "));
    }
    println!("\nElsewhere: --lat 12.34 --lon 56.78 --tz Area/City");
}

fn describe(place: &Place) -> String {
    let ns = if place.lat >= 0.0 { 'N' } else { 'S' };
    let ew = if place.lon >= 0.0 { 'E' } else { 'W' };
    let coords = format!("{:.4}°{ns}, {:.4}°{ew}, {}", place.lat.abs(), place.lon.abs(), place.tz);
    if place.name.is_empty() { coords } else { format!("{} ({coords})", place.name) }
}

/// A local wall-clock time as Unix seconds, flagging clock changes.
fn local_moment(place: &Place, date: NaiveDate, time: NaiveTime) -> Result<i64, Box<dyn Error>> {
    match place.tz.from_local_datetime(&date.and_time(time)) {
        LocalResult::Single(dt) => Ok(dt.timestamp()),
        LocalResult::Ambiguous(first, _) => {
            eprintln!("note: {date} {time} happened twice in {} (clocks went back); using the first", place.tz);
            Ok(first.timestamp())
        }
        LocalResult::None => Err(format!("{date} {time} never happened in {} (clocks went forward)", place.tz).into()),
    }
}

fn parse_time(s: &str) -> Result<NaiveTime, String> {
    let lower = s.trim().to_ascii_lowercase();
    let (clock, pm) = match (lower.strip_suffix("pm"), lower.strip_suffix("am")) {
        (Some(c), _) => (c.trim(), Some(true)),
        (_, Some(c)) => (c.trim(), Some(false)),
        _ => (lower.as_str(), None),
    };
    let err = || format!("expected HH:MM or HH:MM:SS, got {s:?}");
    let t = NaiveTime::parse_from_str(clock, "%H:%M:%S")
        .or_else(|_| NaiveTime::parse_from_str(clock, "%H:%M"))
        .map_err(|_| err())?;
    match pm {
        None => Ok(t),
        Some(_) if t.hour() == 0 || t.hour() > 12 => Err(err()),
        Some(pm) => Ok(t.with_hour(t.hour() % 12 + if pm { 12 } else { 0 }).unwrap()),
    }
}
