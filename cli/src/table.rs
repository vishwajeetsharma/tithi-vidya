//! The precomputed tithi boundary table. Its binary format is documented in
//! generator/generate_table.py, which writes it.

use std::sync::OnceLock;

const MAGIC: &[u8; 8] = b"TITHITB1";
const HEADER_LEN: usize = 28;
static EMBEDDED: &[u8] = include_bytes!("../data/tithi-table.bin");

/// A tithi and the civil Unix seconds it runs over, `[start, end)`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TithiSpan {
    /// 0..=29: 0 is Shukla Pratipada, 14 Purnima, 29 Amavasya.
    pub index: usize,
    pub start: i64,
    pub end: i64,
}

/// An amanta lunar month (new moon to new moon).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Masa {
    /// 0..=11: 0 is Chaitra.
    pub index: usize,
    pub adhika: bool,
}

pub struct Table {
    /// Civil Unix seconds of every boundary, ascending.
    times: Vec<i64>,
    /// Tithi index that begins at `times[0]`.
    first_index: usize,
    /// Position in `times` of the first new moon (a boundary that begins tithi 0).
    first_new_moon: usize,
    /// Lahiri sidereal rashi of the Sun (0 = Mesha) at each new moon.
    new_moon_rashi: Vec<u8>,
    /// UT1 minus civil seconds on 1 Jan of `offset_first_year + k`.
    offset_first_year: i32,
    offsets: Vec<f32>,
}

impl Table {
    /// The table compiled into the binary.
    pub fn embedded() -> &'static Table {
        static TABLE: OnceLock<Table> = OnceLock::new();
        TABLE.get_or_init(|| Table::parse(EMBEDDED).expect("embedded tithi table is malformed"))
    }

    pub fn parse(bytes: &[u8]) -> Result<Table, &'static str> {
        if bytes.len() < HEADER_LEN || &bytes[..8] != MAGIC {
            return Err("not a tithi table");
        }
        let u32_at = |b: &[u8]| u32::from_le_bytes(b.try_into().unwrap());
        let start = i64::from_le_bytes(bytes[8..16].try_into().unwrap());
        let count = u32_at(&bytes[16..20]) as usize;
        let first_index = bytes[20] as usize;
        let offset_first_year = i16::from_le_bytes(bytes[22..24].try_into().unwrap()) as i32;
        let years = u16::from_le_bytes(bytes[24..26].try_into().unwrap()) as usize;
        if count < 2 || first_index >= 30 || years < 2 {
            return Err("bad header");
        }

        let first_new_moon = (30 - first_index) % 30;
        let new_moons = count.saturating_sub(first_new_moon).div_ceil(30);
        let deltas_end = HEADER_LEN + 4 * (count - 1);
        let rashi_end = deltas_end + new_moons;
        if bytes.len() != rashi_end + 4 * years {
            return Err("wrong length");
        }

        let mut times = Vec::with_capacity(count);
        let mut t = start;
        times.push(t);
        for d in bytes[HEADER_LEN..deltas_end].chunks_exact(4) {
            t += u32_at(d) as i64;
            times.push(t);
        }
        let offsets = bytes[rashi_end..]
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes(b.try_into().unwrap()))
            .collect();
        Ok(Table {
            times,
            first_index,
            first_new_moon,
            new_moon_rashi: bytes[deltas_end..rashi_end].to_vec(),
            offset_first_year,
            offsets,
        })
    }

    /// First and last boundary, civil Unix seconds.
    pub fn range(&self) -> (i64, i64) {
        (self.times[0], self.times[self.times.len() - 1])
    }

    /// The tithi in effect at `unix`.
    pub fn tithi_at(&self, unix: i64) -> Option<TithiSpan> {
        let i = self.times.partition_point(|&t| t <= unix);
        (i > 0 && i < self.times.len()).then(|| self.span(i - 1))
    }

    /// Every occurrence of tithi `index` that begins in `[from, to)`.
    pub fn occurrences(&self, index: usize, from: i64, to: i64) -> impl Iterator<Item = TithiSpan> + '_ {
        let lo = self.times.partition_point(|&t| t < from);
        let first = lo + (index + 30 - self.index_from(lo)) % 30;
        (first..self.times.len() - 1)
            .step_by(30)
            .map(|i| self.span(i))
            .take_while(move |s| s.start < to)
    }

    /// The amanta month containing `unix`: named after the sidereal sign the Sun
    /// is in at the new moon that starts it, and adhika when the Sun is still in
    /// that sign at the next new moon (no sankranti in between).
    pub fn masa_at(&self, unix: i64) -> Option<Masa> {
        let i = self.times.partition_point(|&t| t <= unix).checked_sub(1)?;
        let k = i.checked_sub(self.first_new_moon)? / 30;
        let this = *self.new_moon_rashi.get(k)?;
        let next = *self.new_moon_rashi.get(k + 1)?;
        Some(Masa { index: (this as usize + 1) % 12, adhika: this == next })
    }

    /// Earth-rotation time (UT1) minus civil time in seconds at civil time `unix`.
    /// Zero before 1972, under a second until now, a prediction after that.
    pub fn ut1_minus_civil(&self, unix: f64) -> f64 {
        const SECONDS_PER_YEAR: f64 = 365.2425 * 86400.0;
        let last = (self.offsets.len() - 1) as f64;
        let x = (1970.0 + unix / SECONDS_PER_YEAR - self.offset_first_year as f64).clamp(0.0, last);
        let k = (x as usize).min(self.offsets.len() - 2);
        let f = x - k as f64;
        self.offsets[k] as f64 * (1.0 - f) + self.offsets[k + 1] as f64 * f
    }

    fn index_from(&self, i: usize) -> usize {
        (self.first_index + i) % 30
    }

    fn span(&self, i: usize) -> TithiSpan {
        TithiSpan { index: self.index_from(i), start: self.times[i], end: self.times[i + 1] }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn occurrences_are_one_lunation_apart() {
        let table = Table::embedded();
        let (start, end) = table.range();
        let spans: Vec<_> = table.occurrences(2, start, end).collect();
        assert!(spans.len() > 3000);
        for pair in spans.windows(2) {
            assert_eq!(pair[0].index, 2);
            let days = (pair[1].start - pair[0].start) as f64 / 86400.0;
            assert!((29.0..30.0).contains(&days), "lunation of {days} days");
        }
    }

    #[test]
    fn nothing_outside_the_table() {
        let table = Table::embedded();
        let (start, end) = table.range();
        assert_eq!(table.tithi_at(start - 1), None);
        assert_eq!(table.tithi_at(end), None);
        assert!(table.tithi_at(start).is_some());
    }
}
