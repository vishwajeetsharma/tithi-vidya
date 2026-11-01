use serde_json::{Value, json};
use tithi_wasm::{birth_json, places_json};

fn birth(query: Value) -> Value {
    serde_json::from_str(&birth_json(&query.to_string())).unwrap()
}

#[test]
fn lists_places() {
    let places: Value = serde_json::from_str(&places_json()).unwrap();
    assert_eq!(places[0]["name"], "New Delhi");
    assert_eq!(places[0]["tz"], "Asia/Kolkata");
}

#[test]
fn tithi_birthday_once_a_year() {
    let v = birth(json!({"date": "2000-01-01", "time": "06:30", "place": "New Delhi"}));
    assert_eq!(v["birth"]["tithi"], "Krishna Dashami", "{v}");
    assert_eq!(v["birth"]["month"], "Margashirsha");
    assert_eq!(v["birth"]["udaya_tithi"], "Krishna Navami");
    assert_eq!(v["birth"]["before_sunrise"], true);
    let gap = v["birth"]["elongation"].as_f64().unwrap();
    assert!((288.0..300.0).contains(&gap), "{gap}");
    assert_eq!((v["from"].as_i64(), v["to"].as_i64()), (Some(2001), Some(2100)));
    let dates = v["dates"].as_array().unwrap();
    assert_eq!(dates.len(), 100);
    assert_eq!(dates[0]["date"], "2002-01-08");
    assert_eq!(dates[0]["label"], "Tue, 8 Jan 2002");
}

#[test]
fn every_occurrence_at_coordinates() {
    let v = birth(json!({
        "date": "2000-01-01", "time": "06:30", "lat": 28.6139, "lon": 77.209,
        "tz": "Asia/Kolkata", "yearly": false, "from": 2026, "to": 2026
    }));
    assert_eq!(v["yearly"], false, "{v}");
    assert_eq!(v["place"]["name"], "");
    let dates = v["dates"].as_array().unwrap();
    assert!((12..=13).contains(&dates.len()), "{} dates", dates.len());
    assert!(dates.iter().all(|d| d["year"] == 2026));
}

#[test]
fn bad_input_gets_a_message() {
    for (query, needle) in [
        (json!({"date": "2000-13-01", "time": "06:30", "place": "delhi"}), "date"),
        (json!({"date": "2000-01-01", "time": "25:00", "place": "delhi"}), "time"),
        (json!({"date": "2000-01-01", "time": "06:30", "place": "atlantis"}), "place"),
        (json!({"date": "2000-01-01", "time": "06:30", "lat": 28.6, "lon": 77.2, "tz": "Mars/Base"}), "time zone"),
        (json!({"date": "1850-01-01", "time": "06:30", "place": "delhi"}), "1900"),
        (json!({"date": "2025-03-09", "time": "02:30", "place": "nyc"}), "never happened"),
    ] {
        let v = birth(query.clone());
        let error = v["error"].as_str().unwrap_or_else(|| panic!("{query}: {v}"));
        assert!(error.contains(needle), "{query}: {error}");
    }
}
