"""Independent check of cli/data/tithi-table.bin against Swiss Ephemeris (Moshier mode)."""
import math, struct, sys
from datetime import datetime, timedelta, timezone
import numpy as np
import swisseph as swe

b = open(sys.argv[1], 'rb').read()
start, n, first, _, y0, ny, _ = struct.unpack('<qIBBhHH', b[8:28])
deltas = np.frombuffer(b, '<u4', count=n - 1, offset=28).astype(np.int64)
times = np.concatenate([[start], start + np.cumsum(deltas)])
first_nm = (30 - first) % 30
m = math.ceil((n - first_nm) / 30)
rashi = np.frombuffer(b, 'u1', count=m, offset=28 + 4 * (n - 1))
offsets = np.frombuffer(b, '<f4', count=ny, offset=len(b) - 4 * ny)
FLAGS = swe.FLG_MOSEPH
swe.set_sid_mode(swe.SIDM_LAHIRI)


def ut1_offset(unix):
    x = np.clip(1970 + unix / (365.2425 * 86400) - y0, 0, ny - 1)
    k = min(int(x), ny - 2)
    f = x - k
    return offsets[k] * (1 - f) + offsets[k + 1] * f


def jd_ut(unix):
    return (unix + ut1_offset(unix)) / 86400.0 + 2440587.5


def elong(jd):
    s = swe.calc_ut(jd, swe.SUN, FLAGS)[0][0]
    m_ = swe.calc_ut(jd, swe.MOON, FLAGS)[0][0]
    return (m_ - s) % 360.0


# A. Every boundary: how far is Swiss from the exact 12-degree multiple at our instant?
errs, years = [], []
for i, t in enumerate(times):
    want = ((first + i) % 30) * 12.0
    diff = (elong(jd_ut(float(t))) - want + 180) % 360 - 180
    errs.append(diff / 12.19 * 86400)  # seconds at the mean rate
    years.append(1970 + t / (365.2425 * 86400))
errs, years = np.abs(errs), np.array(years)
print(f"A. {len(errs)} boundaries vs Swiss: median {np.median(errs):.1f}s  p99 {np.percentile(errs, 99):.1f}s  max {errs.max():.1f}s")
for lo, hi in ((1900, 1972), (1972, 2026), (2026, 2100), (2100, 2150)):
    sel = (years >= lo) & (years < hi)
    print(f"   {lo}-{hi}: median {np.median(errs[sel]):.1f}s  max {errs[sel].max():.1f}s")

# B. Lunar months: Lahiri sidereal sign of the Sun at each new moon.
nm_bad = []
close = []
for k in range(m):
    t = times[first_nm + 30 * k]
    jd = jd_ut(float(t))
    lon = swe.calc_ut(jd, swe.SUN, FLAGS | swe.FLG_SIDEREAL)[0][0]
    close.append(abs(((lon + 15) % 30) - 15))
    if int(lon // 30) != rashi[k]:
        nm_bad.append((datetime.fromtimestamp(int(t), timezone.utc).date().isoformat(), int(lon // 30), int(rashi[k]), round(lon, 4)))
print(f"B. {m} new moons: {len(nm_bad)} sign differences; closest new moon to a sign edge {min(close)*60:.2f} arcmin")
print("  ", nm_bad[:10])

# C. Tithi at sunrise for every day 1900-2149 at New Delhi.
geo = (77.2090, 28.6139, 0.0)
idx_at = lambda u: (first + np.searchsorted(times, u, side='right') - 1) % 30
day = datetime(1900, 1, 1, tzinfo=timezone.utc)
end = datetime(2150, 1, 1, tzinfo=timezone.utc)
jd = day.timestamp() / 86400 + 2440587.5 - 0.4
total = bad = 0
gaps = []
badlist = []
while True:
    res, tret = swe.rise_trans(jd, swe.SUN, swe.CALC_RISE, geo, 1013.25, 15.0, FLAGS)
    sr = tret[0]
    jd = sr + 0.5
    unix = (sr - 2440587.5) * 86400
    unix -= ut1_offset(unix)
    if unix >= end.timestamp():
        break
    ours = int(idx_at(unix))
    theirs = int(elong(sr) // 12)
    total += 1
    if ours != theirs:
        bad += 1
        i = np.searchsorted(times, unix)
        gap = min(abs(times[i] - unix), abs(times[i - 1] - unix))
        gaps.append(gap)
        badlist.append((datetime.fromtimestamp(unix, timezone(timedelta(hours=5, minutes=30))).strftime('%Y-%m-%d %H:%M:%S'), ours, theirs, round(float(gap), 1)))
print(f"C. {total} New Delhi sunrises: {bad} differ ({bad / total * 100:.4f}%)")
print("   max gap to a boundary among differences:", max(gaps) if gaps else None, "s")
print("  ", badlist[:12])
