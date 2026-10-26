"""Generate the tithi boundary table that the Rust CLI embeds.

    .venv/bin/python generate_table.py --ephemeris de440s.bsp --out ../cli/data/tithi-table.bin

A tithi boundary is the same instant everywhere on Earth, so one table serves
every place; only sunrise is computed per place at runtime.

Binary layout (little-endian), version 1:
  offset  size
  0       8        magic b"TITHITB1"
  8       8        i64  civil Unix seconds of the first boundary
  16      4        u32  boundary count N
  20      1        u8   tithi index (0-29) that begins at the first boundary
  21      1        reserved (0)
  22      2        i16  first year Y0 of the Earth-rotation series
  24      2        u16  year count Y
  26      2        reserved (0)
  28      4(N-1)   u32  seconds from each boundary to the next
          M        u8   Lahiri sidereal rashi of the Sun (0 = Mesha) at each new
                        moon, i.e. each boundary that begins tithi 0, in order
          4Y       f32  UT1 minus civil time in seconds at 00:00 UTC, 1 Jan of Y0+k
"""
import argparse
import struct
from datetime import datetime, timezone

import numpy as np
from skyfield.searchlib import find_discrete

from ephem import Sky

MAGIC = b"TITHITB1"
FIRST_OFFSET_YEAR, LAST_OFFSET_YEAR = 1899, 2151


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--ephemeris", default="de440s.bsp")
    ap.add_argument("--out", default="../cli/data/tithi-table.bin")
    args = ap.parse_args()

    sky = Sky(args.ephemeris)
    ts = sky.ts

    def index(t):
        return sky.tithi_index(t)

    index.step_days = 0.5  # the shortest tithi is ~20 h, so 12 h steps cannot skip one

    # de440s covers 1849-12-26 to 2150-01-21; start early enough that 1900 has a
    # preceding new moon (needed for its lunar month).
    edges = [ts.utc(1899, 11, 1)] + [ts.utc(y, 1, 1) for y in range(1910, 2150, 10)] + [ts.utc(2150, 1, 15)]
    tts, values = [], []
    for a, b in zip(edges, edges[1:]):
        t, v = find_discrete(a, b, index)
        tts.append(t.tt)
        values.append(v)
        print(f"  {a.utc_strftime('%Y')}-{b.utc_strftime('%Y')}: {len(v)} boundaries")
    t = ts.tt_jd(np.concatenate(tts))
    values = np.concatenate(values).astype(int)

    if not np.all((values[1:] - values[:-1]) % 30 == 1):
        raise SystemExit("tithis are not in strict sequence; search step too coarse?")

    unix = np.round(sky.civil_unix(t)).astype(np.int64)
    deltas = np.diff(unix)
    if deltas.min() <= 0 or deltas.max() >= 2 ** 32:
        raise SystemExit("unexpected boundary spacing")

    new_moons = np.nonzero(values == 0)[0]
    rashi = (sky.sidereal_sun(t[new_moons]) // 30.0).astype(np.uint8)

    years = np.arange(FIRST_OFFSET_YEAR, LAST_OFFSET_YEAR + 1)
    jan1 = [datetime(int(y), 1, 1, tzinfo=timezone.utc).timestamp() for y in years]
    offsets = sky.ut1_minus_civil(jan1).astype("<f4")

    with open(args.out, "wb") as f:
        f.write(MAGIC)
        f.write(struct.pack("<qIBBhHH", unix[0], len(unix), values[0], 0, FIRST_OFFSET_YEAR, len(years), 0))
        f.write(deltas.astype("<u4").tobytes())
        f.write(rashi.tobytes())
        f.write(offsets.tobytes())

    steps = (rashi[1:].astype(int) - rashi[:-1]) % 12
    hours = deltas / 3600.0
    first, last = (datetime.fromtimestamp(int(x), timezone.utc) for x in (unix[0], unix[-1]))
    print(f"wrote {args.out}: {len(unix)} boundaries, {first:%Y-%m-%d} to {last:%Y-%m-%d}")
    print(f"  tithi length {hours.min():.2f} h to {hours.max():.2f} h")
    print(f"  {len(new_moons)} new moons, {np.count_nonzero(steps == 0)} adhika months, "
          f"{np.count_nonzero(steps == 2)} kshaya months")


if __name__ == "__main__":
    main()
