//! Sunrise from the low-precision solar model in Meeus, Astronomical Algorithms
//! ch. 25 (about 0.01 degrees). That puts sunrise within a few seconds, well
//! under the minute panchangs publish. The Moon is never computed here: tithi
//! times come from the table.

/// The Sun's upper edge on the horizon with standard refraction, as Drik Panchang uses.
pub const SUNRISE_ALTITUDE_DEG: f64 = -0.8333;

/// The sunrise nearest to `guess` (both Unix-style seconds on UT1), or `None`
/// when the Sun does not rise or set that day.
pub fn sunrise_near(lat_deg: f64, lon_deg: f64, guess: f64) -> Option<f64> {
    let (sin_lat, cos_lat) = lat_deg.to_radians().sin_cos();
    let sin_h0 = SUNRISE_ALTITUDE_DEG.to_radians().sin();
    let mut t = guess;
    for _ in 0..10 {
        let (ra, dec, gast) = sun_equatorial(t / 86400.0 + 2440587.5);
        let cos_h0 = (sin_h0 - sin_lat * dec.sin()) / (cos_lat * dec.cos());
        if !(-1.0..=1.0).contains(&cos_h0) {
            return None;
        }
        let rising_hour_angle = -cos_h0.acos().to_degrees();
        let hour_angle = gast + lon_deg - ra.to_degrees();
        // The Sun's hour angle advances about 360 degrees a day.
        let step = wrap180(rising_hour_angle - hour_angle) / 360.0 * 86400.0;
        t += step;
        if step.abs() < 0.1 {
            break;
        }
    }
    Some(t)
}

/// Apparent right ascension and declination (radians) and apparent sidereal
/// time at Greenwich (degrees) for Julian day `jd`.
fn sun_equatorial(jd: f64) -> (f64, f64, f64) {
    let d = jd - 2451545.0;
    let t = d / 36525.0;
    let l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    let m = (357.52911 + 35999.05029 * t - 0.0001537 * t * t).to_radians();
    let center = (1.914602 - 0.004817 * t - 0.000014 * t * t) * m.sin()
        + (0.019993 - 0.000101 * t) * (2.0 * m).sin()
        + 0.000289 * (3.0 * m).sin();
    let omega = (125.04 - 1934.136 * t).to_radians();
    let nutation = -0.00478 * omega.sin(); // nutation in longitude, main term
    let lambda = (l0 + center - 0.00569 + nutation).to_radians(); // -0.00569: aberration
    let epsilon = (23.439291111 - 0.013004167 * t - 1.639e-7 * t * t + 5.036e-7 * t * t * t
        + 0.00256 * omega.cos())
    .to_radians();
    let ra = (epsilon.cos() * lambda.sin()).atan2(lambda.cos());
    let dec = (epsilon.sin() * lambda.sin()).asin();
    let gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - t * t * t / 38710000.0;
    (ra, dec, gmst + nutation * epsilon.cos())
}

fn wrap180(deg: f64) -> f64 {
    (deg + 180.0).rem_euclid(360.0) - 180.0
}
