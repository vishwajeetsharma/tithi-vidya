//! Built-in places. Anywhere else can be given as --lat, --lon and --tz.

use crate::names::normalize;
use crate::panchang::Place;

pub struct KnownPlace {
    pub name: &'static str,
    pub aliases: &'static [&'static str],
    pub lat: f64,
    pub lon: f64,
    pub tz: &'static str,
}

impl KnownPlace {
    pub fn to_place(&self) -> Place {
        let tz = self.tz.parse().expect("built-in time zones are valid");
        Place { name: self.name.to_string(), lat: self.lat, lon: self.lon, tz }
    }
}

const fn place(name: &'static str, aliases: &'static [&'static str], lat: f64, lon: f64, tz: &'static str) -> KnownPlace {
    KnownPlace { name, aliases, lat, lon, tz }
}

const IST: &str = "Asia/Kolkata";

pub const PLACES: &[KnownPlace] = &[
    place("New Delhi", &["delhi"], 28.6139, 77.2090, IST),
    place("Mumbai", &["bombay"], 19.0760, 72.8777, IST),
    place("Kolkata", &["calcutta"], 22.5726, 88.3639, IST),
    place("Chennai", &["madras"], 13.0827, 80.2707, IST),
    place("Bengaluru", &["bangalore"], 12.9716, 77.5946, IST),
    place("Hyderabad", &[], 17.3850, 78.4867, IST),
    place("Ahmedabad", &[], 23.0225, 72.5714, IST),
    place("Pune", &["poona"], 18.5204, 73.8567, IST),
    place("Jaipur", &[], 26.9124, 75.7873, IST),
    place("Lucknow", &[], 26.8467, 80.9462, IST),
    place("Kanpur", &[], 26.4499, 80.3319, IST),
    place("Varanasi", &["banaras", "benares", "kashi"], 25.3176, 82.9739, IST),
    place("Prayagraj", &["allahabad"], 25.4358, 81.8463, IST),
    place("Ujjain", &[], 23.1765, 75.7885, IST),
    place("Indore", &[], 22.7196, 75.8577, IST),
    place("Bhopal", &[], 23.2599, 77.4126, IST),
    place("Nagpur", &[], 21.1458, 79.0882, IST),
    place("Surat", &[], 21.1702, 72.8311, IST),
    place("Patna", &[], 25.5941, 85.1376, IST),
    place("Chandigarh", &[], 30.7333, 76.7794, IST),
    place("Amritsar", &[], 31.6340, 74.8723, IST),
    place("Dehradun", &[], 30.3165, 78.0322, IST),
    place("Haridwar", &[], 29.9457, 78.1642, IST),
    place("Srinagar", &[], 34.0837, 74.7973, IST),
    place("Guwahati", &[], 26.1445, 91.7362, IST),
    place("Bhubaneswar", &[], 20.2961, 85.8245, IST),
    place("Visakhapatnam", &["vizag"], 17.6868, 83.2185, IST),
    place("Panaji", &["goa"], 15.4909, 73.8278, IST),
    place("Mysuru", &["mysore"], 12.2958, 76.6394, IST),
    place("Kochi", &["cochin"], 9.9312, 76.2673, IST),
    place("Thiruvananthapuram", &["trivandrum"], 8.5241, 76.9366, IST),
    place("Madurai", &[], 9.9252, 78.1198, IST),
    place("Kathmandu", &[], 27.7172, 85.3240, "Asia/Kathmandu"),
    place("Dhaka", &[], 23.8103, 90.4125, "Asia/Dhaka"),
    place("Colombo", &[], 6.9271, 79.8612, "Asia/Colombo"),
    place("Singapore", &[], 1.3521, 103.8198, "Asia/Singapore"),
    place("Dubai", &[], 25.2048, 55.2708, "Asia/Dubai"),
    place("London", &[], 51.5074, -0.1278, "Europe/London"),
    place("New York", &["nyc"], 40.7128, -74.0060, "America/New_York"),
    place("Toronto", &[], 43.6532, -79.3832, "America/Toronto"),
    place("San Francisco", &["sf"], 37.7749, -122.4194, "America/Los_Angeles"),
    place("Sydney", &[], -33.8688, 151.2093, "Australia/Sydney"),
];

pub fn find(query: &str) -> Option<&'static KnownPlace> {
    let q = normalize(query);
    PLACES
        .iter()
        .find(|p| normalize(p.name) == q || p.aliases.iter().any(|a| normalize(a) == q))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_by_name_and_alias() {
        assert_eq!(find("new delhi").unwrap().name, "New Delhi");
        assert_eq!(find("Delhi").unwrap().name, "New Delhi");
        assert_eq!(find("bombay").unwrap().name, "Mumbai");
        assert!(find("atlantis").is_none());
    }

    #[test]
    fn every_time_zone_is_known() {
        for p in PLACES {
            assert_eq!(p.to_place().tz.name(), p.tz);
        }
    }
}
