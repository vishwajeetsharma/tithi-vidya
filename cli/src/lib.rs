//! Tithi lookups backed by a table of tithi boundaries precomputed from JPL DE440.
//!
//! A tithi boundary is the same instant everywhere, so the table serves every
//! place; only sunrise is computed per place.

pub mod names;
pub mod panchang;
pub mod places;
pub mod sun;
pub mod table;
