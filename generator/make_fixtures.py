"""Write reference data for the Rust tests, computed straight from DE440 (not from the table).

    .venv/bin/python make_fixtures.py --ephemeris de440s.bsp --out ../cli/tests/fixtures

  tithi_instants.csv  unix,tithi           random instants 1900-2149, half of them within
                                           10 minutes of a boundary
  sunrise.csv         lat,lon,unix         sunrises for 8 cities in 6 years
  udaya_delhi.csv     date,tithi,gap       New Delhi sunrise tithi for every day of 1950,
                                           2026 and 2100; gap = seconds from sunrise to the
                                           nearest tithi boundary
"""
import argparse
import os
from datetime import datetime, timedelta, timezone

import numpy as np
from skyfield import almanac
from skyfield.api import wgs84
from skyfield.searchlib import find_discrete

from ephem import UTC_1972_UNIX, Sky

CITIES = [
    (28.6139, 77.2090),    # New Delhi
    (19.0760, 72.8777),    # Mumbai
    (13.0827, 80.2707),    # Chennai
    (22.5726, 88.3639),    # Kolkata
    (34.0837, 74.7973),    # Srinagar
    (51.5074, -0.1278),    # London
    (40.7128, -74.0060),   # New York
    (-33.8688, 151.2093),  # Sydney
]
SUNRISE_YEARS = [1900, 1950, 1985, 2026, 2075, 2149]
UDAYA_YEARS = [1950, 2026, 2100]
IST = timezone(timedelta(hours=5, minutes=30))


def tithi_at_civil(sky, unix):
    unix = np.asarray(unix, dtype=float)
    out = np.empty(len(unix), dtype=int)
    for early in (True, False):
        sel = (unix < UTC_1972_UNIX) == early
        if sel.any():
            out[sel] = sky.tithi_index(sky.from_civil_unix(unix[sel]))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ephemeris", default="de440s.bsp")
    ap.add_argument("--out", default="../cli/tests/fixtures")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    sky = Sky(args.ephemeris)
    ts = sky.ts
    rng = np.random.default_rng(7)

    def index(t):
        return sky.tithi_index(t)

    index.step_days = 0.5

    # Random instants, plus instants a few seconds to minutes either side of real boundaries.
    lo = datetime(1900, 1, 1, tzinfo=timezone.utc).timestamp()
    hi = datetime(2149, 12, 1, tzinfo=timezone.utc).timestamp()
    uniform = rng.uniform(lo, hi, 1500).round()
    near = []
    for start in rng.uniform(lo, hi - 40 * 86400, 50):
        t0 = sky.from_civil_unix([start])
        t, _ = find_discrete(t0[0], ts.tt_jd(t0.tt[0] + 30), index)
        b = sky.civil_unix(t)
        sign = rng.choice([-1.0, 1.0], len(b))
        near.extend((b + sign * rng.uniform(5, 600, len(b))).round())
    instants = np.concatenate([uniform, np.array(near)]).astype(np.int64)
    tithis = tithi_at_civil(sky, instants)
    with open(os.path.join(args.out, "tithi_instants.csv"), "w") as f:
        f.write("unix,tithi\n")
        f.writelines(f"{u},{k}\n" for u, k in zip(instants, tithis))
    print(f"tithi_instants.csv: {len(instants)} rows")

    rows = 0
    with open(os.path.join(args.out, "sunrise.csv"), "w") as f:
        f.write("lat,lon,unix\n")
        for lat, lon in CITIES:
            place = sky.earth + wgs84.latlon(lat, lon)
            for y in SUNRISE_YEARS:
                t, real = almanac.find_risings(place, sky.sun, ts.utc(y, 1, 1), ts.utc(y, 12, 31))
                unix = sky.civil_unix(t[real])[::3]
                f.writelines(f"{lat},{lon},{u:.1f}\n" for u in unix)
                rows += len(unix)
    print(f"sunrise.csv: {rows} rows")

    delhi = sky.earth + wgs84.latlon(*CITIES[0])
    rows = 0
    with open(os.path.join(args.out, "udaya_delhi.csv"), "w") as f:
        f.write("date,tithi,gap\n")
        for y in UDAYA_YEARS:
            t, _ = almanac.find_risings(delhi, sky.sun, ts.utc(y, 1, 1, -6), ts.utc(y + 1, 1, 1, -6))
            unix = sky.civil_unix(t)
            tithis = tithi_at_civil(sky, unix)
            b, _ = find_discrete(ts.tt_jd(t.tt[0] - 2), ts.tt_jd(t.tt[-1] + 2), index)
            bu = sky.civil_unix(b)
            gaps = np.abs(bu[np.clip(np.searchsorted(bu, unix) + np.array([[-1], [0]]), 0, len(bu) - 1)] - unix).min(axis=0)
            for u, k, g in zip(unix, tithis, gaps):
                f.write(f"{datetime.fromtimestamp(u, IST):%Y-%m-%d},{k},{g:.0f}\n")
            rows += len(unix)
    print(f"udaya_delhi.csv: {rows} rows")


if __name__ == "__main__":
    main()
