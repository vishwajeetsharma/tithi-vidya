"""Turns the "Tithi Vidya" wordmark into vector outlines, so logo files show
the right letters even where the font is not installed.

It uses the site's own trimmed Fraunces display font (site/src/fonts), at
weight 600 like the site header, shaped with HarfBuzz so kerning matches the
browser. Writes brand/tools/wordmark.json for make-assets.mjs.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli uharfbuzz
    .venv/bin/python brand/tools/make-wordmark.py
"""
import io
import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "site/src/fonts/fraunces-display.woff2"
TEXT = "Tithi Vidya"
WEIGHT = 600
SIZE = 100  # outlines are drawn at a 100-unit font size
TRACKING = -0.008  # the site's .display letter-spacing, in em

font = TTFont(FONT)
if "fvar" in font:
    font = instancer.instantiateVariableFont(font, {"wght": WEIGHT})
buffer = io.BytesIO()
font.flavor = None
font.save(buffer)
data = buffer.getvalue()
font = TTFont(io.BytesIO(data))

face = hb.Face(data)
hbfont = hb.Font(face)
upm = face.upem
hbbuf = hb.Buffer()
hbbuf.add_str(TEXT)
hbbuf.guess_segment_properties()
hb.shape(hbfont, hbbuf, {"kern": True, "liga": True})

scale = SIZE / upm
glyphs = font.getGlyphSet()
order = font.getGlyphOrder()
pen = SVGPathPen(glyphs, ntos=lambda n: f"{n:.2f}".rstrip("0").rstrip("."))
bounds = BoundsPen(glyphs)
x = 0.0
for info, pos in zip(hbbuf.glyph_infos, hbbuf.glyph_positions):
    name = order[info.codepoint]
    transform = (scale, 0, 0, -scale, (x + pos.x_offset) * scale, -pos.y_offset * scale)
    glyphs[name].draw(TransformPen(pen, transform))
    glyphs[name].draw(TransformPen(bounds, transform))
    x += pos.x_advance + TRACKING * upm

os2 = font["OS/2"]
left, top, right, bottom = bounds.bounds  # y is flipped, so "top" is the lowest point
out = {
    "text": TEXT,
    "fontSize": SIZE,
    "path": pen.getCommands(),
    "bounds": {"x": round(left, 2), "y": round(top, 2), "width": round(right - left, 2), "height": round(bottom - top, 2)},
    "capHeight": round(os2.sCapHeight * scale, 2),
    "xHeight": round(os2.sxHeight * scale, 2),
}
(Path(__file__).parent / "wordmark.json").write_text(json.dumps(out, indent=1) + "\n")
print(f"wordmark: {out['bounds']}, cap height {out['capHeight']}")
