//! Tithi and lunar month names, and lenient parsing of what people type.

use crate::table::Masa;

const TITHIS: [&str; 14] = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
    "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

pub const MASAS: [&str; 12] = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
];

const TITHI_ALIASES: [&[&str]; 14] = [
    &["pratipada", "pratipat", "pratipad", "prathama", "padyami", "padwa", "padva"],
    &["dwitiya", "dvitiya", "dwithiya", "vidiya", "dooj", "duj"],
    &["tritiya", "tritya", "trutiya", "tadiya", "teej", "tij"],
    &["chaturthi", "chathurthi", "chauth", "chavithi"],
    &["panchami"],
    &["shashthi", "shashti", "shasthi", "sashti", "chhath"],
    &["saptami"],
    &["ashtami"],
    &["navami"],
    &["dashami", "dasami"],
    &["ekadashi", "ekadasi", "gyaras"],
    &["dwadashi", "dvadashi", "dwadasi", "baras"],
    &["trayodashi", "trayodasi", "teras"],
    &["chaturdashi", "chaturdasi", "chaudas"],
];
const PURNIMA: &[&str] = &["purnima", "poornima", "pournami", "purnami", "punam"];
const AMAVASYA: &[&str] = &["amavasya", "amavasi", "amavas", "amawasya", "amavasai"];

const MASA_ALIASES: [&[&str]; 12] = [
    &["chaitra", "chaitr", "chait"],
    &["vaishakha", "vaisakha", "vaishakh", "vaisakh", "baisakh", "baishakh"],
    &["jyeshtha", "jyaistha", "jyeshta", "jyestha", "jeth"],
    &["ashadha", "asadha", "aashaadha", "ashadh", "asharh", "aashad"],
    &["shravana", "sravana", "shravan", "sravan", "sawan", "savan"],
    &["bhadrapada", "bhadrapad", "bhadra", "bhadon"],
    &["ashvina", "ashwina", "ashvin", "ashwin", "asvina", "aswina"],
    &["kartika", "kartik", "karthika", "karthik"],
    &["margashirsha", "margasirsha", "margashira", "margasira", "agrahayana", "aghan"],
    &["pausha", "paush", "pausa", "pushya", "posh"],
    &["magha", "magh", "maagha"],
    &["phalguna", "phalgun", "phagun", "falgun"],
];

/// "Shukla Tritiya", "Purnima", "Krishna Ashtami", "Amavasya".
pub fn tithi_name(index: usize) -> String {
    match index {
        14 => "Purnima".to_string(),
        29 => "Amavasya".to_string(),
        i => format!("{} {}", paksha(i), TITHIS[i % 15]),
    }
}

pub fn paksha(index: usize) -> &'static str {
    if index < 15 { "Shukla" } else { "Krishna" }
}

pub fn masa_name(masa: Masa) -> String {
    if masa.adhika {
        format!("Adhika {}", MASAS[masa.index])
    } else {
        MASAS[masa.index].to_string()
    }
}

/// The month's name in the purnimanta system, where the dark fortnight takes
/// the next month's name. Adhika months run new moon to new moon in both.
pub fn purnimanta_name(masa: Masa, tithi_index: usize) -> String {
    if masa.adhika || tithi_index < 15 {
        masa_name(masa)
    } else {
        MASAS[(masa.index + 1) % 12].to_string()
    }
}

/// Parses "Shukla Tritiya", "krishna-8", "S3", "K14", "Purnima", "amavasya" or 1-30.
pub fn parse_tithi(input: &str) -> Result<usize, String> {
    let err = || {
        format!("unknown tithi {input:?}; try \"Shukla Tritiya\", \"Krishna 8\", \"Purnima\" or a number 1-30")
    };
    let words: Vec<String> = input
        .split(|c: char| c.is_whitespace() || c == '-' || c == '_' || c == ',')
        .map(normalize)
        .filter(|w| !w.is_empty())
        .collect();
    match words.as_slice() {
        [word] => {
            if let Ok(n) = word.parse::<usize>() {
                return (1..=30).contains(&n).then(|| n - 1).ok_or_else(err);
            }
            if PURNIMA.contains(&word.as_str()) {
                return Ok(14);
            }
            if AMAVASYA.contains(&word.as_str()) {
                return Ok(29);
            }
            // Compact form: S3, K14.
            let mut chars = word.chars();
            let head = chars.next().map(String::from).unwrap_or_default();
            let base = paksha_base(&head).ok_or_else(err)?;
            let n = chars.as_str().parse::<usize>().ok().filter(|n| (1..=15).contains(n)).ok_or_else(err)?;
            Ok(base + n - 1)
        }
        [paksha, tithi] => {
            let base = paksha_base(paksha).ok_or_else(err)?;
            let n = tithi_number(tithi, base).ok_or_else(err)?;
            Ok(base + n - 1)
        }
        _ => Err(err()),
    }
}

/// Parses an amanta month name such as "Pausha", "Paush" or "Ashwin".
pub fn parse_masa(input: &str) -> Result<usize, String> {
    let word = normalize(input);
    MASA_ALIASES
        .iter()
        .position(|names| names.contains(&word.as_str()))
        .ok_or_else(|| format!("unknown lunar month {input:?}; expected one of {}", MASAS.join(", ")))
}

/// Lowercase letters and digits only, for matching what people type.
pub fn normalize(s: &str) -> String {
    s.chars().filter(|c| c.is_alphanumeric()).flat_map(char::to_lowercase).collect()
}

fn paksha_base(word: &str) -> Option<usize> {
    match word {
        "shukla" | "sukla" | "shukl" | "sudi" | "shuddha" | "suddha" | "s" => Some(0),
        "krishna" | "krsna" | "krishn" | "vadi" | "badi" | "bahula" | "k" => Some(15),
        _ => None,
    }
}

/// 1..=15 within a paksha; 15 is Purnima in Shukla and Amavasya in Krishna.
fn tithi_number(word: &str, base: usize) -> Option<usize> {
    if let Ok(n) = word.parse::<usize>() {
        return (1..=15).contains(&n).then_some(n);
    }
    if let Some(i) = TITHI_ALIASES.iter().position(|names| names.contains(&word)) {
        return Some(i + 1);
    }
    let fifteenth = if base == 0 { PURNIMA } else { AMAVASYA };
    fifteenth.contains(&word).then_some(15)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_common_spellings() {
        assert_eq!(parse_tithi("Shukla Tritiya"), Ok(2));
        assert_eq!(parse_tithi("shukla-tritiya"), Ok(2));
        assert_eq!(parse_tithi("Sukla Dvitiya"), Ok(1));
        assert_eq!(parse_tithi("S3"), Ok(2));
        assert_eq!(parse_tithi("krishna 8"), Ok(22));
        assert_eq!(parse_tithi("K14"), Ok(28));
        assert_eq!(parse_tithi("Purnima"), Ok(14));
        assert_eq!(parse_tithi("shukla 15"), Ok(14));
        assert_eq!(parse_tithi("Amavasya"), Ok(29));
        assert_eq!(parse_tithi("30"), Ok(29));
        assert!(parse_tithi("Krishna Purnima").is_err());
        assert!(parse_tithi("31").is_err());
        assert!(parse_tithi("tuesday").is_err());
    }

    #[test]
    fn every_name_parses_back() {
        for i in 0..30 {
            assert_eq!(parse_tithi(&tithi_name(i)), Ok(i), "{}", tithi_name(i));
        }
        for (i, name) in MASAS.iter().enumerate() {
            assert_eq!(parse_masa(name), Ok(i));
        }
    }

    #[test]
    fn parses_month_spellings() {
        assert_eq!(parse_masa("paush"), Ok(9));
        assert_eq!(parse_masa("Ashwin"), Ok(6));
        assert_eq!(parse_masa("Sawan"), Ok(4));
        assert!(parse_masa("January").is_err());
    }

    #[test]
    fn purnimanta_shifts_only_the_dark_fortnight() {
        let pausha = Masa { index: 9, adhika: false };
        assert_eq!(purnimanta_name(pausha, 2), "Pausha");
        assert_eq!(purnimanta_name(pausha, 20), "Magha");
        let adhika = Masa { index: 2, adhika: true };
        assert_eq!(purnimanta_name(adhika, 20), "Adhika Jyeshtha");
    }
}
