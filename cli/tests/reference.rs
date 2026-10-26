//! Checks against data computed straight from JPL DE440 (tests/fixtures, written by
//! generator/make_fixtures.py) and against published panchang dates.

use chrono::{NaiveDate, TimeZone, Timelike};
use chrono_tz::Asia::Kolkata;

use tithi::names::MASAS;
use tithi::panchang::{self, DayKind, Place};
use tithi::sun;
use tithi::table::Table;

fn fixture(name: &str) -> Vec<Vec<String>> {
    let path = format!("{}/tests/fixtures/{name}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
    text.lines().skip(1).map(|l| l.split(',').map(str::to_string).collect()).collect()
}

fn delhi() -> Place {
    Place { name: "New Delhi".into(), lat: 28.6139, lon: 77.2090, tz: Kolkata }
}

fn date(y: i32, m: u32, d: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(y, m, d).unwrap()
}

fn ist_noon(y: i32, m: u32, d: u32) -> i64 {
    Kolkata.with_ymd_and_hms(y, m, d, 12, 0, 0).unwrap().timestamp()
}

/// Seconds between `unix` and the IST clock reading hh:mm on the same day.
fn seconds_from_ist(unix: i64, hh: u32, mm: u32) -> i64 {
    let local = Kolkata.timestamp_opt(unix, 0).unwrap();
    (local.hour() * 3600 + local.minute() * 60 + local.second()) as i64 - (hh * 3600 + mm * 60) as i64
}

#[test]
fn table_covers_1900_to_2149() {
    let (start, end) = Table::embedded().range();
    assert!(start < ist_noon(1900, 1, 1));
    assert!(end > ist_noon(2149, 12, 31));
}

#[test]
fn tithi_lookup_matches_de440() {
    let table = Table::embedded();
    let rows = fixture("tithi_instants.csv");
    assert!(rows.len() > 3000);
    for row in rows {
        let unix: i64 = row[0].parse().unwrap();
        let want: usize = row[1].parse().unwrap();
        assert_eq!(table.tithi_at(unix).unwrap().index, want, "at unix {unix}");
    }
}

#[test]
fn sunrise_matches_de440_within_10_seconds() {
    let table = Table::embedded();
    let mut worst = 0.0f64;
    for row in fixture("sunrise.csv") {
        let [lat, lon, want] = [0, 1, 2].map(|i| row[i].parse::<f64>().unwrap());
        let offset = table.ut1_minus_civil(want);
        let got = sun::sunrise_near(lat, lon, want - 3.0 * 3600.0 + offset).unwrap() - offset;
        worst = worst.max((got - want).abs());
    }
    eprintln!("worst sunrise error {worst:.1} s");
    assert!(worst < 10.0, "worst sunrise error {worst:.1} s");
}

#[test]
fn udaya_tithi_matches_de440_at_new_delhi() {
    let table = Table::embedded();
    let mut checked = 0;
    for row in fixture("udaya_delhi.csv") {
        let day: NaiveDate = row[0].parse().unwrap();
        let want: usize = row[1].parse().unwrap();
        let gap: f64 = row[2].parse().unwrap();
        let (_, span) = panchang::udaya_tithi(table, &delhi(), day).unwrap();
        // Within a few seconds of a boundary the answer is a coin toss for any method.
        if gap > 10.0 {
            assert_eq!(span.index, want, "{day}");
            checked += 1;
        }
    }
    assert!(checked > 1000);
}

#[test]
fn matches_drik_panchang_new_delhi_2026_10_26() {
    // Drik Panchang for New Delhi shows sunrise 06:29 and "Purnima upto 09:41 AM".
    let table = Table::embedded();
    let (sunrise, span) = panchang::udaya_tithi(table, &delhi(), date(2026, 10, 26)).unwrap();
    assert!(seconds_from_ist(sunrise, 6, 29).abs() <= 60);
    assert_eq!(span.index, 14);
    assert!((0..60).contains(&seconds_from_ist(span.end, 9, 41)));
}

#[test]
fn adhika_months_match_published_years() {
    let table = Table::embedded();
    for ((y, m, d), name) in [
        ((2012, 9, 1), "Bhadrapada"),
        ((2015, 7, 1), "Ashadha"),
        ((2018, 6, 1), "Jyeshtha"),
        ((2020, 10, 1), "Ashvina"),
        ((2023, 8, 1), "Shravana"),
        ((2026, 6, 1), "Jyeshtha"),
    ] {
        let masa = table.masa_at(ist_noon(y, m, d)).unwrap();
        assert!(masa.adhika, "{y}-{m}-{d} should be in an adhika month");
        assert_eq!(MASAS[masa.index], name, "{y}-{m}-{d}");
    }
    let after = table.masa_at(ist_noon(2026, 7, 1)).unwrap();
    assert_eq!((MASAS[after.index], after.adhika), ("Jyeshtha", false));
}

#[test]
fn ugadi_dates_match_published_dates() {
    // Ugadi / Gudi Padwa: Chaitra Shukla Pratipada.
    let table = Table::embedded();
    for (year, want) in [(2023, date(2023, 3, 22)), (2024, date(2024, 4, 9)), (2025, date(2025, 3, 30)), (2026, date(2026, 3, 19))] {
        let span = table
            .occurrences(0, ist_noon(year, 1, 1), ist_noon(year, 12, 31))
            .find(|s| table.masa_at(s.start).is_some_and(|m| m.index == 0 && !m.adhika))
            .unwrap();
        let occ = panchang::assign_date(table, &delhi(), span).unwrap();
        assert_eq!(occ.date, want, "Ugadi {year} ({:?})", occ.kind);
    }
}

#[test]
fn kshaya_and_vriddhi_get_one_date_each() {
    let table = Table::embedded();
    let (mut kshaya, mut vriddhi) = (0, 0);
    let mut previous: Option<NaiveDate> = None;
    for span in table.occurrences(2, ist_noon(2000, 1, 1), ist_noon(2030, 1, 1)) {
        let occ = panchang::assign_date(table, &delhi(), span).unwrap();
        match occ.kind {
            DayKind::Normal => {}
            DayKind::Kshaya => kshaya += 1,
            DayKind::Vriddhi(second) => {
                vriddhi += 1;
                assert_eq!(second, occ.date.succ_opt().unwrap());
            }
        }
        if let Some(p) = previous {
            assert!((occ.date - p).num_days() >= 28, "{p} then {}", occ.date);
        }
        previous = Some(occ.date);
    }
    // Over 30 years a given tithi is skipped or doubled now and then, not often.
    assert!(kshaya > 0 && vriddhi > 0, "kshaya {kshaya}, vriddhi {vriddhi}");
    assert!(kshaya + vriddhi < 80, "kshaya {kshaya}, vriddhi {vriddhi}");
}
