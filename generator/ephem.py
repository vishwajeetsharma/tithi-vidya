"""Astronomy shared by the table generator and the test-fixture script.

Everything here comes from JPL DE440 through Skyfield: apparent geocentric
ecliptic longitudes of the Sun and Moon, the same quantities Drik-style
panchangs use.
"""
import numpy as np
from skyfield.api import load
from skyfield.framelib import ecliptic_frame
from skyfield.nutationlib import iau2000a_radians

UNIX_EPOCH_JD = 2440587.5
UTC_1972_UNIX = 63072000  # 1972-01-01 00:00:00 UTC

# Lahiri (Chitrapaksha) ayanamsa, defined as in Swiss Ephemeris: the mean value
# at 1956-03-21 00:00 TT, carried forward with IAU 1976 general precession.
LAHIRI_T0_JD = 2435553.5
LAHIRI_T0_DEG = 23.245524743


class Sky:
    def __init__(self, ephemeris_path):
        self.ts = load.timescale()
        eph = load(ephemeris_path)
        self.earth, self.sun, self.moon = eph['earth'], eph['sun'], eph['moon']
        self._tt_1972 = self.ts.utc(1972, 1, 1).tt

    def longitudes(self, t):
        """Apparent geocentric longitudes (degrees, true ecliptic and equinox of date)."""
        e = self.earth.at(t)
        _, sun, _ = e.observe(self.sun).apparent().frame_latlon(ecliptic_frame)
        _, moon, _ = e.observe(self.moon).apparent().frame_latlon(ecliptic_frame)
        return sun.degrees, moon.degrees

    def tithi_index(self, t):
        """0..29: 0 is Shukla Pratipada, 14 Purnima, 29 Amavasya."""
        sun, moon = self.longitudes(t)
        return (((moon - sun) % 360.0) // 12.0).astype(int)

    def sidereal_sun(self, t):
        """Sun's sidereal longitude with the Lahiri ayanamsa (degrees)."""
        sun, _ = self.longitudes(t)
        dpsi, _ = iau2000a_radians(t)
        return (sun - np.degrees(dpsi) - lahiri_mean(t.tt)) % 360.0

    def civil_unix(self, t):
        """Unix seconds on the clock people actually used.

        Before 1972 civil time followed mean solar time (UT1); Skyfield's UTC
        there assumes a fixed 10 s leap offset and drifts by up to ~44 s by
        1900. From 1972 civil time is UTC, with no leap seconds assumed after
        today's 37 (they are due to be abolished by 2035).
        """
        tt = np.atleast_1d(t.tt)
        ut1 = (np.atleast_1d(t.ut1) - UNIX_EPOCH_JD) * 86400.0
        utc = np.array([d.timestamp() for d in np.atleast_1d(t.utc_datetime())])
        return np.where(tt < self._tt_1972, ut1, utc)

    def from_civil_unix(self, unix):
        unix = np.atleast_1d(np.asarray(unix, dtype=float))
        if np.all(unix < UTC_1972_UNIX):
            return self.ts.ut1_jd(unix / 86400.0 + UNIX_EPOCH_JD)
        if np.all(unix >= UTC_1972_UNIX):
            return self._utc_from_unix(unix)
        raise ValueError("pass instants on one side of 1972 at a time")

    def ut1_minus_civil(self, unix):
        """Earth-rotation time minus civil time, in seconds (0 before 1972)."""
        unix = np.atleast_1d(np.asarray(unix, dtype=float))
        out = np.zeros(len(unix))
        late = unix >= UTC_1972_UNIX
        if late.any():
            t = self._utc_from_unix(unix[late])
            out[late] = (t.ut1 - UNIX_EPOCH_JD) * 86400.0 - unix[late]
        return out

    def _utc_from_unix(self, unix):
        # Unix time skips leap seconds, so split it into whole days and seconds
        # of the day; ts.utc(1970, 1, 1, 0, 0, unix) would count leap seconds.
        days = np.floor(unix / 86400.0)
        return self.ts.utc(1970, 1, 1 + days, 0, 0, unix - days * 86400.0)


def lahiri_mean(tt_jd):
    def precession(T):  # IAU 1976 general precession in longitude, degrees
        return (5029.0966 * T + 1.11113 * T * T - 0.000006 * T ** 3) / 3600.0

    T = (np.asarray(tt_jd) - 2451545.0) / 36525.0
    T0 = (LAHIRI_T0_JD - 2451545.0) / 36525.0
    return LAHIRI_T0_DEG + precession(T) - precession(T0)
