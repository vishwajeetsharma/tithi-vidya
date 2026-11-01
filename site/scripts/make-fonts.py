"""Builds trimmed Fraunces display fonts from Google's full variable files.

Keeps only what the site's headings use: Basic Latin and common punctuation,
the soft, wonky display cut, and weights 400 to 700. The files drop from 121 KB
and 150 KB to 21 KB and 27 KB. Fraunces is under the SIL Open Font License
(src/fonts/OFL.txt).

    pip install fonttools brotli
    python make-fonts.py <full-fraunces.woff2> <output.woff2> 144
"""
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

UNICODES = [*range(0x20, 0x7F), 0xA0, 0xB0, 0xB7, 0xD7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2212]

source, target, opsz = sys.argv[1], sys.argv[2], float(sys.argv[3])
font = TTFont(source)
font = instancer.instantiateVariableFont(font, {"opsz": opsz, "SOFT": 100, "WONK": 1, "wght": (400, 700)})
for glyph in font.getGlyphOrder():  # the subsetter expects an entry for every glyph
    font["gvar"].variations.setdefault(glyph, [])
options = subset.Options(layout_features=["kern", "liga", "lnum", "tnum", "ccmp", "locl", "mark", "mkmk"], flavor="woff2", notdef_outline=True)
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=UNICODES)
subsetter.subset(font)
font.flavor = "woff2"
font.save(target)
