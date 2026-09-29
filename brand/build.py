"""Kampung logo kit builder — Happy Roofs (^‿^ with attap-roof eyes).

Run from brand/: needs `pip install fonttools` and SpaceGrotesk[wght].ttf here
(see README.md §7). Writes to ./kit/ — copy what changed into svg/.

Every stroke is expanded to filled outlines (capsules + a round-capped arc band),
so masters contain no strokes, text, transforms or filters.
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = "kit"
os.makedirs(OUT, exist_ok=True)

TEAL, INK, PAPER = "#0E7C6B", "#1C2B35", "#FAFAF6"
f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")


def capsule(p, q, h):
    (x1, y1), (x2, y2) = p, q
    L = math.hypot(x2 - x1, y2 - y1)
    nx, ny = -(y2 - y1) / L * h, (x2 - x1) / L * h
    return (f"M{f(x1+nx)} {f(y1+ny)}L{f(x2+nx)} {f(y2+ny)}"
            f"A{f(h)} {f(h)} 0 0 0 {f(x2-nx)} {f(y2-ny)}"
            f"L{f(x1-nx)} {f(y1-ny)}A{f(h)} {f(h)} 0 0 0 {f(x1+nx)} {f(y1+ny)}Z")


def arc_band(cx, cy, r, a1, a2, h):
    """Round-capped band along a circle from angle a1 to a2 (radians, y-down, a1<a2)."""
    R, ri = r + h, r - h
    P = lambda rad, a: (cx + rad * math.cos(a), cy + rad * math.sin(a))
    o1, o2, i1, i2 = P(R, a1), P(R, a2), P(ri, a1), P(ri, a2)
    large = 1 if a2 - a1 > math.pi else 0
    return (f"M{f(o1[0])} {f(o1[1])}A{f(R)} {f(R)} 0 {large} 1 {f(o2[0])} {f(o2[1])}"
            f"A{f(h)} {f(h)} 0 0 1 {f(i2[0])} {f(i2[1])}"
            f"A{f(ri)} {f(ri)} 0 {large} 0 {f(i1[0])} {f(i1[1])}"
            f"A{f(h)} {f(h)} 0 0 1 {f(o1[0])} {f(o1[1])}Z")


def face(w, eye_cx, eye_hw, eye_h, eye_top, smile_half, smile_r, smile_y, centre_y=124):
    """Build the mark; returns (path_d, bbox). Everything is shifted so the bbox
    centre sits at centre_y (a touch above 128 = optical centre)."""
    h = w / 2
    parts = []
    # smile circle centre from chord endpoints
    scy = smile_y - math.sqrt(smile_r**2 - smile_half**2)
    top = eye_top - h
    bottom = scy + smile_r + h
    dy = centre_y - (top + bottom) / 2
    for cx in eye_cx:
        apex = (cx, eye_top + dy)
        parts.append(capsule((cx - eye_hw, eye_top + eye_h + dy), apex, h))
        parts.append(capsule(apex, (cx + eye_hw, eye_top + eye_h + dy), h))
    a1 = math.atan2(smile_y - scy, smile_half)          # right end
    a2 = math.atan2(smile_y - scy, -smile_half)         # left end
    parts.append(arc_band(128, scy + dy, smile_r, a1, a2, h))
    return "".join(parts), (top + dy, bottom + dy)


# Master: 60° roof pitch (hw 34, h 59), stroke 30.
MASTER = dict(eye_cx=(70, 186), eye_hw=34, eye_h=59, eye_top=54,
              smile_half=66, smile_r=76, smile_y=156)
# Small-size cut (≤24 px): heavier stroke, same 60° pitch, shorter roofs.
SMALL = dict(eye_cx=(66, 190), eye_hw=33, eye_h=57, eye_top=50,
             smile_half=60, smile_r=68, smile_y=152)

master_d, _ = face(30, **MASTER)
reversed_d, _ = face(28.5, **MASTER)          # thinned for light-on-dark
small_d, _ = face(38, **SMALL)


def svg(w, h, body, title="Kampung logo"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" '
            f'width="{f(w)}" height="{f(h)}" role="img"><title>{title}</title>{body}</svg>\n')


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


# ---- symbols -------------------------------------------------------------
for tag, d in (("", master_d), ("-small", small_d)):
    write(f"kampung-symbol{tag}-black.svg", svg(256, 256, f'<path fill="#000" d="{d}"/>'))
    write(f"kampung-symbol{tag}-teal.svg", svg(256, 256, f'<path fill="{TEAL}" d="{d}"/>'))
    write(f"kampung-symbol{tag}-ink.svg", svg(256, 256, f'<path fill="{INK}" d="{d}"/>'))
write("kampung-symbol-reversed.svg",
      svg(256, 256, f'<path fill="{PAPER}" d="{reversed_d}"/>'))

# App-icon tile: teal squircle-ish rounded square, paper face at ~62 % scale.
def tile(d, scale, rx=56):
    off = 128 * (1 - scale)
    return (f'<rect width="256" height="256" rx="{rx}" fill="{TEAL}"/>'
            f'<path fill="{PAPER}" transform="translate({f(off)} {f(off)}) scale({scale})" d="{d}"/>')
write("kampung-app-icon.svg", svg(256, 256, tile(reversed_d, 0.66)))
write("kampung-app-icon-small.svg", svg(256, 256, tile(small_d, 0.78, rx=48)))

# ---- wordmark (Space Grotesk Bold, outlined) -------------------------------
font = instantiateVariableFont(TTFont("SpaceGrotesk.ttf"), {"wght": 700})
gs, cmap = font.getGlyphSet(), font.getBestCmap()
upm = font["head"].unitsPerEm
cap_h = font["OS/2"].sCapHeight


def wordmark(text, size, tracking_em=-0.02):
    s = size / upm
    x, pen = 0.0, SVGPathPen(gs)
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))   # baseline at y=0
        x += gs[g].width * s + tracking_em * size
    bp = BoundsPen(gs)
    x2 = 0.0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(bp, (s, 0, 0, -s, x2, 0)))
        x2 += gs[g].width * s + tracking_em * size
    xmin, ymin, xmax, ymax = bp.bounds
    return pen.getCommands(), (xmin, ymin, xmax, ymax), cap_h * s


def shift(d, dx, dy):
    """Translate an absolute-only SVG path string (as produced by SVGPathPen)."""
    import re
    out, tokens = [], re.findall(r"[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?", d)
    cmd, idx = None, 0
    for t in tokens:
        if t.isalpha():
            cmd, idx = t, 0
            out.append(t)
            continue
        v = float(t)
        if cmd in "HV":
            v += dx if cmd == "H" else dy
        else:
            v += dx if idx % 2 == 0 else dy
        idx += 1
        out.append(f(v))
    return " ".join(out).replace(" -", "-")


# Symbol visible height ≈ 170 of 256; cap height ≈ 0.6 × that.
size = 0.6 * 170 / (cap_h / upm)
wd, (wx0, wy0, wx1, wy1), capH = wordmark("Kampung", size)
gap = 44
# Horizontal lockup: height 256, cap-height centred on the mark's centre (124).
baseline = 124 + capH / 2
wx = 256 + gap - wx0 - 20          # symbol has ~21 units side bearing
horiz_w = math.ceil(wx + wx1 + 24)
for tag, fill, d in (("black", "#000", master_d), ("teal", TEAL, master_d),
                     ("ink", INK, master_d), ("reversed", PAPER, reversed_d)):
    body = (f'<g fill="{fill}"><path d="{d}"/>'
            f'<path d="{shift(wd, wx, baseline)}"/></g>')
    write(f"kampung-horizontal-{tag}.svg", svg(horiz_w, 256, body))
# Two-colour horizontal: teal mark + ink wordmark (the default in-app pairing).
write("kampung-horizontal-color.svg", svg(horiz_w, 256,
      f'<path fill="{TEAL}" d="{master_d}"/><path fill="{INK}" d="{shift(wd, wx, baseline)}"/>'))

# Stacked lockup: mark on top, wordmark centred below.
ww = wx1 - wx0
st_w = max(256, ww + 48)
sx = (st_w - 256) / 2
st_base = 256 + capH + 8
st_h = st_base + (-wy0 if wy0 < 0 else 0) + 24
body = (f'<path fill="{TEAL}" transform="translate({f(sx)} 0)" d="{master_d}"/>'
        f'<path fill="{INK}" d="{shift(wd, (st_w - ww) / 2 - wx0, st_base)}"/>')
write("kampung-stacked-color.svg", svg(st_w, st_h, body))
body_b = body.replace(TEAL, "#000").replace(INK, "#000")
write("kampung-stacked-black.svg", svg(st_w, st_h, body_b))

# Wordmark only.
write("kampung-wordmark-ink.svg",
      svg(ww + 16, capH + 8 + max(0, -wy0) + 8, f'<path fill="{INK}" d="{shift(wd, 8 - wx0, capH + 8)}"/>'))

# 24-unit versions for the React component + Next icon (small cut, scaled 24/256).
s24 = 24 / 256
print("SMALL24", f"scale({s24})")
with open(os.path.join(OUT, "_small_d.txt"), "w") as fh:
    fh.write(small_d)
with open(os.path.join(OUT, "_master_d.txt"), "w") as fh:
    fh.write(master_d)
print("wordmark size", round(size, 1), "horiz width", round(horiz_w), "stacked", round(st_w), round(st_h))
