//! The tithi library as a dependency-free WebAssembly module, so the website
//! runs entirely in the visitor's browser and birth details never leave it.
//!
//! Each call takes and returns JSON. See site/src/lib/engine.ts for the caller.
//!
//!   tithi_birth   {date, time, place | lat+lon+tz, yearly?, from?, to?}
//!   tithi_places  (no input)

use chrono::{Datelike, NaiveDate};
use serde::{Deserialize, Serialize};

use tithi::names::{self, masa_name, paksha, purnimanta_name, tithi_name};
use tithi::panchang::{self, DayKind, FIRST_YEAR, LAST_YEAR, Place};
use tithi::places::{self, PLACES};
use tithi::table::{Table, TithiSpan};

#[derive(Serialize)]
pub struct PlaceOut {
    name: String,
    lat: f64,
    lon: f64,
    tz: String,
}

impl From<&Place> for PlaceOut {
    fn from(p: &Place) -> Self {
        PlaceOut { name: p.name.clone(), lat: p.lat, lon: p.lon, tz: p.tz.name().to_string() }
    }
}

#[derive(Deserialize)]
struct BirthQuery {
    date: String,
    time: String,
    place: Option<String>,
    lat: Option<f64>,
    lon: Option<f64>,
    tz: Option<String>,
    #[serde(default = "default_yearly")]
    yearly: bool,
    from: Option<i32>,
    to: Option<i32>,
}

fn default_yearly() -> bool {
    true
}

#[derive(Serialize)]
struct BirthResponse {
    place: PlaceOut,
    birth: BirthOut,
    yearly: bool,
    from: i32,
    to: i32,
    notes: Vec<String>,
    dates: Vec<DateOut>,
}

#[derive(Serialize)]
struct BirthOut {
    moment: String,
    tithi: String,
    number: usize,
    paksha: &'static str,
    /// Sun-Moon gap in degrees at the moment of birth, for drawing the moon.
    elongation: f64,
    begins: String,
    ends: String,
    month: String,
    purnimanta_month: String,
    adhika: bool,
    panchang_date: String,
    sunrise: String,
    udaya_tithi: String,
    before_sunrise: bool,
}

#[derive(Serialize)]
struct DateOut {
    date: String,
    label: String,
    year: i32,
    month: String,
    begins: String,
    ends: String,
    kind: &'static str,
    also: Option<String>,
}

#[derive(Serialize)]
struct ErrorOut {
    error: String,
}

/// Birth tithi and the dates it returns on. The result, or `{"error": ...}`.
pub fn birth_json(input: &str) -> String {
    let result = serde_json::from_str::<BirthQuery>(input)
        .map_err(|e| format!("bad request: {e}"))
        .and_then(birth_dates);
    to_json(result)
}

pub fn places_json() -> String {
    let places: Vec<PlaceOut> = PLACES.iter().map(|p| PlaceOut::from(&p.to_place())).collect();
    serde_json::to_string(&places).expect("places serialize")
}

fn to_json<T: Serialize>(result: Result<T, String>) -> String {
    match result {
        Ok(value) => serde_json::to_string(&value).expect("response serializes"),
        Err(error) => serde_json::to_string(&ErrorOut { error }).expect("error serializes"),
    }
}

/// The Sun-Moon gap at `unix`, read off the table: 12 degrees for each tithi
/// passed, plus the share of the current one. Close enough to draw the moon.
fn elongation(span: TithiSpan, unix: i64) -> f64 {
    let share = (unix - span.start) as f64 / (span.end - span.start) as f64;
    (span.index as f64 + share) * 12.0
}

fn birth_dates(q: BirthQuery) -> Result<BirthResponse, String> {
    let table = Table::embedded();
    let place = resolve_place(&q)?;
    let date: NaiveDate = q.date.parse().map_err(|_| format!("Please enter a date like 2000-01-31, not {:?}.", q.date))?;
    let time = panchang::parse_time(&q.time)?;
    let (moment, ambiguous) = panchang::local_moment(&place, date, time).map_err(|e| e.to_string())?;
    let span = table.tithi_at(moment).ok_or(panchang::Error::OutOfRange.to_string())?;
    let masa = table.masa_at(moment).ok_or(panchang::Error::OutOfRange.to_string())?;
    let (day, sunrise) = panchang::panchang_day(table, &place, moment).map_err(|e| e.to_string())?;
    let udaya = table.tithi_at(sunrise).ok_or(panchang::Error::OutOfRange.to_string())?;

    let mut notes = Vec::new();
    if ambiguous {
        notes.push(format!("Clocks went back that night, so {time} happened twice. We used the first one."));
    }
    if q.yearly && masa.adhika {
        notes.push(format!(
            "You were born in an extra month (Adhika {name}). These dates use the regular {name} each year.",
            name = names::MASAS[masa.index]
        ));
    }
    let from = q.from.unwrap_or(date.year() + 1);
    let to = q.to.unwrap_or(date.year() + 100);
    if from < FIRST_YEAR || to > LAST_YEAR {
        notes.push(format!("Our data covers {FIRST_YEAR} to {LAST_YEAR}, so years outside that are left out."));
    }
    let (from, to) = (from.max(FIRST_YEAR), to.min(LAST_YEAR));
    if from > to {
        return Err(format!("Our data covers {FIRST_YEAR} to {LAST_YEAR}, so there are no years to show."));
    }
    let month = q.yearly.then_some(masa.index);
    let occurrences = panchang::list_dates(table, &place, span.index, month, from, to).map_err(|e| e.to_string())?;

    let stamp = |unix: i64| place.local(unix).format("%-d %b %Y, %H:%M").to_string();
    let label = |d: NaiveDate| d.format("%a, %-d %b %Y").to_string();
    let dates = occurrences
        .iter()
        .map(|occ| {
            let (kind, also) = match occ.kind {
                DayKind::Normal => ("normal", None),
                DayKind::Kshaya => ("kshaya", None),
                DayKind::Vriddhi(second) => ("vriddhi", Some(label(second))),
            };
            DateOut {
                date: occ.date.to_string(),
                label: label(occ.date),
                year: occ.date.year(),
                month: table.masa_at(occ.span.start).map(masa_name).unwrap_or_default(),
                begins: stamp(occ.span.start),
                ends: stamp(occ.span.end),
                kind,
                also,
            }
        })
        .collect();

    Ok(BirthResponse {
        place: PlaceOut::from(&place),
        birth: BirthOut {
            moment: place.local(moment).format("%a, %-d %b %Y, %H:%M %Z").to_string(),
            tithi: tithi_name(span.index),
            number: span.index + 1,
            paksha: paksha(span.index),
            elongation: elongation(span, moment),
            begins: stamp(span.start),
            ends: stamp(span.end),
            month: masa_name(masa),
            purnimanta_month: purnimanta_name(masa, span.index),
            adhika: masa.adhika,
            panchang_date: label(day),
            sunrise: place.local(sunrise).format("%H:%M").to_string(),
            udaya_tithi: tithi_name(udaya.index),
            before_sunrise: day != date,
        },
        yearly: q.yearly,
        from,
        to,
        notes,
        dates,
    })
}

fn resolve_place(q: &BirthQuery) -> Result<Place, String> {
    match (&q.place, q.lat, q.lon, &q.tz) {
        (Some(name), _, _, _) => {
            places::find(name).map(|p| p.to_place()).ok_or_else(|| format!("We don't know the place {name:?}."))
        }
        (None, Some(lat), Some(lon), Some(tz)) => Place::from_coordinates(lat, lon, tz),
        _ => Err("Please choose a place, or enter latitude, longitude and time zone.".to_string()),
    }
}

// The WebAssembly interface. Inputs are UTF-8 in memory from `tithi_alloc`;
// outputs are a 4-byte little-endian length followed by that many bytes, freed
// with `tithi_free(ptr, length + 4)`.

#[unsafe(no_mangle)]
pub extern "C" fn tithi_alloc(len: usize) -> *mut u8 {
    Box::into_raw(vec![0u8; len].into_boxed_slice()) as *mut u8
}

/// # Safety
/// `ptr` and `len` must describe a buffer this module handed out.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn tithi_free(ptr: *mut u8, len: usize) {
    drop(unsafe { Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)) });
}

/// # Safety
/// `ptr` and `len` must describe an input buffer from `tithi_alloc`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn tithi_birth(ptr: *const u8, len: usize) -> *mut u8 {
    output(birth_json(unsafe { input(ptr, len) }))
}

#[unsafe(no_mangle)]
pub extern "C" fn tithi_places() -> *mut u8 {
    output(places_json())
}

unsafe fn input<'a>(ptr: *const u8, len: usize) -> &'a str {
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    std::str::from_utf8(bytes).unwrap_or("")
}

fn output(json: String) -> *mut u8 {
    let mut out = Vec::with_capacity(json.len() + 4);
    out.extend_from_slice(&(json.len() as u32).to_le_bytes());
    out.extend_from_slice(json.as_bytes());
    Box::into_raw(out.into_boxed_slice()) as *mut u8
}
