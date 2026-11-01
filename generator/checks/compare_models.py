"""How much does Sun/Moon model precision matter for tithi?

    python compare_models.py ../de440s.bsp

Reference: JPL DE440s via Skyfield (apparent geocentric ecliptic longitudes).
Compared:  (1) a simple textbook formula (Astronomical Almanac low-precision
           Moon, 6 terms, plus the Meeus low-precision Sun), and
           (2) astronomy-engine (a full analytic model).
Metrics:   tithi boundary timing error, and how many days in 1900-2100 get a
           different sunrise tithi at New Delhi. Also shows what the choice of
           sunrise definition alone does.
"""
import sys

import astronomy
import numpy as np
from skyfield import almanac
from skyfield.api import load, wgs84
from skyfield.framelib import ecliptic_frame
from skyfield.searchlib import find_discrete

ts = load.timescale()
eph = load(sys.argv[1])
earth, sun, moon = eph['earth'], eph['sun'], eph['moon']


def elong_ref(t):
    e = earth.at(t)
    _, s, _ = e.observe(sun).apparent().frame_latlon(ecliptic_frame)
    _, m, _ = e.observe(moon).apparent().frame_latlon(ecliptic_frame)
    return (m.degrees - s.degrees) % 360.0


def elong_simple(tt_jd):
    # Both longitudes are mean-equinox-of-date, so nutation cancels.
    T = (np.asarray(tt_jd) - 2451545.0) / 36525.0
    r = np.radians
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
    M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
    C = ((1.914602 - 0.004817 * T - 0.000014 * T * T) * np.sin(r(M))
         + (0.019993 - 0.000101 * T) * np.sin(r(2 * M))
         + 0.000289 * np.sin(r(3 * M)))
    sun_lon = L0 + C - 0.00569  # aberration
    moon_lon = (218.32 + 481267.881 * T
                + 6.29 * np.sin(r(135.0 + 477198.87 * T))
                - 1.27 * np.sin(r(259.3 - 413335.36 * T))
                + 0.66 * np.sin(r(235.7 + 890534.22 * T))
                + 0.21 * np.sin(r(269.9 + 954397.74 * T))
                - 0.19 * np.sin(r(357.5 + 35999.05 * T))
                - 0.11 * np.sin(r(186.5 + 966404.03 * T)))
    return (moon_lon - sun_lon) % 360.0


def elong_ae(ut1_jd):
    out = np.empty(len(ut1_jd))
    for i, jd in enumerate(ut1_jd):
        at = astronomy.Time(jd - 2451545.0)  # astronomy-engine applies its own delta-T
        out[i] = (astronomy.EclipticGeoMoon(at).lon - astronomy.SunPosition(at).elon) % 360.0
    return out


def wrap180(x):
    return (x + 180.0) % 360.0 - 180.0


def tithi_index(t):
    return (elong_ref(t) // 12.0).astype(int)


tithi_index.step_days = 0.5

times = []
for y in range(1900, 2100, 10):
    tb, _ = find_discrete(ts.utc(y, 1, 1), ts.utc(y + 10, 1, 1), tithi_index)
    times.append(tb.tt)
tb = ts.tt_jd(np.concatenate(times))
print(f"tithi boundaries found 1900-2100: {len(tb.tt)}")

e_ref = elong_ref(tb)
rate = wrap180(elong_ref(ts.tt_jd(tb.tt + 0.01)) - elong_ref(ts.tt_jd(tb.tt - 0.01))) / 0.02


def report(name, e_model):
    a = np.abs(-wrap180(e_model - e_ref) / rate * 1440.0)
    print(f"{name}: boundary error in minutes: median {np.median(a):.2f}, 95th pct {np.percentile(a, 95):.2f}, max {a.max():.2f}")


report("simple formula", elong_simple(tb.tt))
report("astronomy-engine", elong_ae(tb.ut1))

delhi = earth + wgs84.latlon(28.6139, 77.2090)
t0, t1 = ts.utc(1900, 1, 1), ts.utc(2100, 1, 1)
sr_std, _ = almanac.find_risings(delhi, sun, t0, t1)                       # upper limb + refraction
sr_ctr, _ = almanac.find_risings(delhi, sun, t0, t1, horizon_degrees=0.0)  # disc centre, no refraction
n = min(len(sr_std.tt), len(sr_ctr.tt))
print(f"sunrises at New Delhi 1900-2100: {n}")
ref_tithi = (elong_ref(sr_std) // 12).astype(int)[:n]


def mismatch(name, tithis):
    bad = np.count_nonzero(tithis[:n] != ref_tithi)
    print(f"  {name:48s} {bad:5d} days differ ({bad / n * 100:.3f}%)")


mismatch("simple formula", (elong_simple(sr_std.tt) // 12).astype(int))
mismatch("astronomy-engine", (elong_ae(sr_std.ut1) // 12).astype(int))
mismatch("DE440, but disc-centre sunrise", (elong_ref(sr_ctr) // 12).astype(int))
