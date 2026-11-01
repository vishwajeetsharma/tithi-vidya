//! A small web front end for the tithi library: one page and a JSON API.
//!
//!   GET /             the page
//!   GET /api/places   built-in places
//!   GET /api/birth    birth tithi and the dates it returns on, from
//!                     ?date=YYYY-MM-DD&time=HH:MM and either &place=NAME
//!                     or &lat=..&lon=..&tz=Area/City; optional &mode=all
//!                     (every occurrence instead of once a year), &from, &to

use axum::http::StatusCode;
use axum::response::{Html, IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router, extract::Query};
use chrono::{Datelike, NaiveDate};
use serde::{Deserialize, Serialize};

use tithi::names::{self, masa_name, paksha, purnimanta_name, tithi_name};
use tithi::panchang::{self, DayKind, FIRST_YEAR, LAST_YEAR, Place};
use tithi::places::{self, PLACES};
use tithi::table::Table;

const INDEX_HTML: &str = include_str!("../static/index.html");

pub fn app() -> Router {
    Router::new()
        .route("/", get(|| async { Html(INDEX_HTML) }))
        .route("/api/places", get(list_places))
        .route("/api/birth", get(birth))
}

#[derive(Serialize)]
struct PlaceOut {
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

async fn list_places() -> Json<Vec<PlaceOut>> {
    Json(PLACES.iter().map(|p| PlaceOut::from(&p.to_place())).collect())
}

#[derive(Deserialize)]
struct BirthQuery {
    date: String,
    time: String,
    place: Option<String>,
    lat: Option<f64>,
    lon: Option<f64>,
    tz: Option<String>,
    mode: Option<String>,
    from: Option<i32>,
    to: Option<i32>,
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
    begins: String,
    ends: String,
    month: String,
    purnimanta_month: String,
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

async fn birth(Query(q): Query<BirthQuery>) -> Response {
    match birth_dates(q) {
        Ok(r) => Json(r).into_response(),
        Err(error) => (StatusCode::BAD_REQUEST, Json(ErrorOut { error })).into_response(),
    }
}

fn birth_dates(q: BirthQuery) -> Result<BirthResponse, String> {
    let table = Table::embedded();
    let place = resolve_place(&q)?;
    let date: NaiveDate = q.date.parse().map_err(|_| format!("expected a date like 2000-01-31, got {:?}", q.date))?;
    let time = panchang::parse_time(&q.time)?;
    let (moment, ambiguous) = panchang::local_moment(&place, date, time).map_err(|e| e.to_string())?;
    let span = table.tithi_at(moment).ok_or(panchang::Error::OutOfRange.to_string())?;
    let masa = table.masa_at(moment).ok_or(panchang::Error::OutOfRange.to_string())?;
    let (day, sunrise) = panchang::panchang_day(table, &place, moment).map_err(|e| e.to_string())?;
    let udaya = table.tithi_at(sunrise).ok_or(panchang::Error::OutOfRange.to_string())?;

    let yearly = q.mode.as_deref() != Some("all");
    let mut notes = Vec::new();
    if ambiguous {
        notes.push(format!("{date} {time} happened twice in {} (clocks went back); the first was used.", place.tz));
    }
    if yearly && masa.adhika {
        notes.push(format!("Born in an adhika month; these are the regular {} each year.", names::MASAS[masa.index]));
    }
    let from = q.from.unwrap_or(date.year() + 1);
    let to = q.to.unwrap_or(date.year() + 100);
    if from < FIRST_YEAR || to > LAST_YEAR {
        notes.push(format!("The data covers {FIRST_YEAR}-{LAST_YEAR}; years outside it are left out."));
    }
    let (from, to) = (from.max(FIRST_YEAR), to.min(LAST_YEAR));
    if from > to {
        return Err(format!("no years to list; the data covers {FIRST_YEAR}-{LAST_YEAR}"));
    }
    let occurrences = panchang::list_dates(table, &place, span.index, yearly.then_some(masa.index), from, to)
        .map_err(|e| e.to_string())?;

    let stamp = |unix: i64| place.local(unix).format("%-d %b %Y, %H:%M").to_string();
    let dates = occurrences
        .iter()
        .map(|occ| {
            let (kind, also) = match occ.kind {
                DayKind::Normal => ("normal", None),
                DayKind::Kshaya => ("kshaya", None),
                DayKind::Vriddhi(second) => ("vriddhi", Some(second.format("%a, %-d %b %Y").to_string())),
            };
            DateOut {
                date: occ.date.to_string(),
                label: occ.date.format("%a, %-d %b %Y").to_string(),
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
            moment: place.local(moment).format("%a, %-d %b %Y, %H:%M:%S %Z").to_string(),
            tithi: tithi_name(span.index),
            number: span.index + 1,
            paksha: paksha(span.index),
            begins: stamp(span.start),
            ends: stamp(span.end),
            month: masa_name(masa),
            purnimanta_month: purnimanta_name(masa, span.index),
            panchang_date: day.format("%a, %-d %b %Y").to_string(),
            sunrise: place.local(sunrise).format("%H:%M").to_string(),
            udaya_tithi: tithi_name(udaya.index),
            before_sunrise: day != date,
        },
        yearly,
        from,
        to,
        notes,
        dates,
    })
}

fn resolve_place(q: &BirthQuery) -> Result<Place, String> {
    match (&q.place, q.lat, q.lon, &q.tz) {
        (Some(name), _, _, _) => places::find(name)
            .map(|p| p.to_place())
            .ok_or_else(|| format!("unknown place {name:?}")),
        (None, Some(lat), Some(lon), Some(tz)) => Place::from_coordinates(lat, lon, tz),
        _ => Err("give a place, or latitude, longitude and time zone".to_string()),
    }
}
