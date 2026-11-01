use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;

async fn get(uri: &str) -> (StatusCode, String) {
    let response = tithi_web::app().oneshot(Request::get(uri).body(Body::empty()).unwrap()).await.unwrap();
    let status = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    (status, String::from_utf8(body.to_vec()).unwrap())
}

async fn get_json(uri: &str) -> (StatusCode, Value) {
    let (status, body) = get(uri).await;
    (status, serde_json::from_str(&body).unwrap_or_else(|e| panic!("{uri}: {e}: {body}")))
}

#[tokio::test]
async fn serves_the_page_and_places() {
    let (status, page) = get("/").await;
    assert_eq!(status, StatusCode::OK);
    assert!(page.contains("<title>Tithi Vidya</title>"));

    let (status, places) = get_json("/api/places").await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(places[0]["name"], "New Delhi");
    assert_eq!(places[0]["tz"], "Asia/Kolkata");
}

#[tokio::test]
async fn tithi_birthday_once_a_year() {
    let (status, v) = get_json("/api/birth?date=2000-01-01&time=06:30&place=New%20Delhi").await;
    assert_eq!(status, StatusCode::OK, "{v}");
    assert_eq!(v["birth"]["tithi"], "Krishna Dashami");
    assert_eq!(v["birth"]["month"], "Margashirsha");
    assert_eq!(v["birth"]["udaya_tithi"], "Krishna Navami");
    assert_eq!(v["birth"]["before_sunrise"], true);
    assert_eq!((v["from"].as_i64(), v["to"].as_i64()), (Some(2001), Some(2100)));
    let dates = v["dates"].as_array().unwrap();
    assert_eq!(dates.len(), 100);
    assert_eq!(dates[0]["date"], "2002-01-08");
    assert_eq!(dates[0]["label"], "Tue, 8 Jan 2002");
}

#[tokio::test]
async fn every_occurrence_at_coordinates() {
    let uri = "/api/birth?date=2000-01-01&time=06:30&lat=28.6139&lon=77.209&tz=Asia/Kolkata&mode=all&from=2026&to=2026";
    let (status, v) = get_json(uri).await;
    assert_eq!(status, StatusCode::OK, "{v}");
    assert_eq!(v["yearly"], false);
    assert_eq!(v["place"]["name"], "");
    let dates = v["dates"].as_array().unwrap();
    assert!((12..=13).contains(&dates.len()), "{} dates", dates.len());
    assert!(dates.iter().all(|d| d["year"] == 2026));
}

#[tokio::test]
async fn bad_input_is_a_400_with_a_message() {
    for (uri, needle) in [
        ("/api/birth?date=2000-13-01&time=06:30&place=delhi", "date"),
        ("/api/birth?date=2000-01-01&time=25:00&place=delhi", "time"),
        ("/api/birth?date=2000-01-01&time=06:30&place=atlantis", "unknown place"),
        ("/api/birth?date=2000-01-01&time=06:30&lat=28.6&lon=77.2&tz=Mars/Base", "time zone"),
        ("/api/birth?date=1850-01-01&time=06:30&place=delhi", "1900-2149"),
        ("/api/birth?date=2025-03-09&time=02:30&place=nyc", "never happened"),
    ] {
        let (status, v) = get_json(uri).await;
        assert_eq!(status, StatusCode::BAD_REQUEST, "{uri}");
        let error = v["error"].as_str().unwrap();
        assert!(error.contains(needle), "{uri}: {error}");
    }
}
