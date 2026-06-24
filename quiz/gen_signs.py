# -*- coding: utf-8 -*-
"""Generate standard road-sign SVGs and attach them to matching questions."""
import json, re, os

RED="#e23b2e"; BLK="#23252b"; BLU="#1b6fb3"; WHT="#ffffff"; YEL="#f6b724"; GRY="#9aa0aa"; GRN="#1f9d62"; AMB="#f6b724"
OUT = os.path.join("img", "signs")
os.makedirs(OUT, exist_ok=True)

def svg(inner, vb="0 0 220 220"):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">'
            '<rect width="100%%" height="100%%" fill="#ffffff"/>%s</svg>') % (vb, inner)

def circle(field=WHT, stroke=RED, sw=18):
    return '<circle cx="110" cy="110" r="93" fill="%s" stroke="%s" stroke-width="%d"/>' % (field, stroke, sw)
def tri():
    return ('<path d="M110 16 L205 192 Q210 202 198 202 L22 202 Q10 202 15 192 Z" '
            'fill="%s" stroke="%s" stroke-width="15" stroke-linejoin="round"/>') % (WHT, RED)
def rect(fill=BLU):
    return '<rect x="14" y="36" width="192" height="148" rx="16" fill="%s"/>' % fill
def slash():
    return '<line x1="46" y1="174" x2="174" y2="46" stroke="%s" stroke-width="16" stroke-linecap="round"/>' % RED
def slash2():
    return ('<line x1="48" y1="172" x2="172" y2="48" stroke="%s" stroke-width="15" stroke-linecap="round"/>'
            '<line x1="48" y1="48" x2="172" y2="172" stroke="%s" stroke-width="15" stroke-linecap="round"/>') % (RED, RED)
def txt(s, y=140, size=86, fill=BLK, x=110):
    return ('<text x="%d" y="%d" font-family="Arial,Helvetica,sans-serif" font-weight="700" '
            'font-size="%d" fill="%s" text-anchor="middle">%s</text>') % (x, y, size, fill, s)

# rear-view car body
def car(x, color, w=42, h=74):
    return ('<g><rect x="%d" y="%d" width="%d" height="%d" rx="9" fill="%s"/>'
            '<rect x="%d" y="%d" width="%d" height="16" rx="5" fill="#ffffff" opacity=".85"/></g>'
            ) % (x, 74, w, h, color, x+6, 84, w-12)
def truck(x, color, w=52, h=90):
    return '<rect x="%d" y="%d" width="%d" height="%d" rx="8" fill="%s"/>' % (x, 64, w, h, color)

SIGNS = {}

# ---- regulatory prohibition (red ring) ----
SIGNS['no_uturn'] = circle() + \
  '<path d="M86 152 V106 a24 24 0 0 1 48 0 V120" fill="none" stroke="%s" stroke-width="14" stroke-linecap="round"/>' % BLK + \
  '<path d="M118 118 L134 144 L150 118 Z" fill="%s"/>' % BLK + slash()
SIGNS['no_left_turn'] = circle() + \
  '<path d="M134 156 V112 H98" fill="none" stroke="%s" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>' % BLK + \
  '<path d="M102 95 L74 112 L102 129 Z" fill="%s"/>' % BLK + slash()
SIGNS['no_overtaking'] = circle() + car(64, BLK) + car(116, RED)
SIGNS['no_overtaking_heavy'] = circle() + truck(58, BLK) + car(120, RED)
SIGNS['no_hitchhiking'] = circle() + \
  '<circle cx="96" cy="62" r="13" fill="%s"/>' % BLK + \
  '<path d="M96 78 L96 132 M96 92 L132 70 M96 132 L80 168 M96 132 L112 168" stroke="%s" stroke-width="12" stroke-linecap="round" fill="none"/>' % BLK + \
  '<circle cx="138" cy="66" r="8" fill="%s"/>' % BLK + slash()
SIGNS['no_parking'] = circle(field=BLU) + txt('P', y=150, size=120, fill=WHT) + slash()
SIGNS['no_stopping'] = circle(field=BLU) + slash2()
SIGNS['speed_80'] = circle() + txt('80', y=142, size=92)
SIGNS['about_turn'] = SIGNS['no_uturn']

# height / width / length restriction
SIGNS['height_restriction'] = circle() + \
  '<rect x="56" y="48" width="108" height="11" fill="%s"/><rect x="56" y="161" width="108" height="11" fill="%s"/>' % (BLK, BLK) + \
  '<path d="M110 66 L96 90 H124 Z" fill="%s"/><path d="M110 154 L96 130 H124 Z" fill="%s"/>' % (BLK, BLK) + \
  '<rect x="104" y="84" width="12" height="52" fill="%s"/>' % BLK
SIGNS['width_restriction'] = circle() + \
  '<rect x="48" y="56" width="11" height="108" fill="%s"/><rect x="161" y="56" width="11" height="108" fill="%s"/>' % (BLK, BLK) + \
  '<path d="M66 110 L90 96 V124 Z" fill="%s"/><path d="M154 110 L130 96 V124 Z" fill="%s"/>' % (BLK, BLK) + \
  '<rect x="84" y="104" width="52" height="12" fill="%s"/>' % BLK
SIGNS['length_restriction'] = circle() + \
  '<rect x="60" y="92" width="100" height="30" rx="6" fill="none" stroke="%s" stroke-width="8"/>' % BLK + \
  '<path d="M58 138 L82 124 V152 Z" fill="%s"/><path d="M162 138 L138 124 V152 Z" fill="%s"/>' % (BLK, BLK) + \
  '<rect x="78" y="132" width="64" height="11" fill="%s"/>' % BLK + txt('15m', y=84, size=34)

# bus / disabled (info / regulatory)
def bus(cx, cy, scale, color=WHT):
    s=scale
    return ('<g transform="translate(%d %d) scale(%s)">'
            '<rect x="-34" y="-26" width="68" height="52" rx="9" fill="%s"/>'
            '<rect x="-26" y="-18" width="52" height="20" rx="4" fill="#1b6fb3"/>'
            '<circle cx="-18" cy="22" r="8" fill="#23252b"/><circle cx="18" cy="22" r="8" fill="#23252b"/></g>'
            ) % (cx, cy, s, color)
SIGNS['bus_regulatory'] = circle(field=BLU) + bus(110, 104, 1.05, WHT)
SIGNS['bus_lane'] = rect(BLU) + bus(110, 104, 1.1, WHT)
SIGNS['disabled_parking'] = rect(BLU) + \
  '<circle cx="96" cy="62" r="12" fill="%s"/>' % WHT + \
  '<path d="M96 76 V110 H138" stroke="%s" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % WHT + \
  '<path d="M96 94 H124" stroke="%s" stroke-width="9" stroke-linecap="round"/>' % WHT + \
  '<circle cx="106" cy="150" r="32" fill="none" stroke="%s" stroke-width="8"/>' % WHT + \
  '<circle cx="106" cy="150" r="6" fill="%s"/>' % WHT

# warning triangles
def tri_sym(inner):  # inner symbol over triangle
    return tri() + inner
SIGNS['road_narrows_left'] = tri_sym(
  '<path d="M78 188 L100 120 V96 M142 188 L120 120 V96" stroke="%s" stroke-width="10" fill="none" stroke-linecap="round"/>' % BLK)
SIGNS['narrow_bridge'] = tri_sym(
  '<rect x="74" y="96" width="14" height="84" fill="%s"/><rect x="132" y="96" width="14" height="84" fill="%s"/>'
  '<rect x="62" y="92" width="38" height="12" fill="%s"/><rect x="120" y="92" width="38" height="12" fill="%s"/>' % (BLK,BLK,BLK,BLK))
SIGNS['hump'] = tri_sym(
  '<path d="M64 176 Q110 96 156 176" fill="none" stroke="%s" stroke-width="13" stroke-linecap="round"/>' % BLK +
  '<rect x="58" y="172" width="104" height="10" fill="%s"/>' % BLK)
SIGNS['loose_stones'] = tri_sym(
  '<path d="M70 168 q34 -14 80 0" stroke="%s" stroke-width="9" fill="none"/>' % BLK +
  '<circle cx="90" cy="150" r="7" fill="%s"/><circle cx="118" cy="142" r="6" fill="%s"/><circle cx="138" cy="156" r="7" fill="%s"/><circle cx="104" cy="160" r="5" fill="%s"/>' % (BLK,BLK,BLK,BLK))
SIGNS['road_works'] = tri_sym(
  '<circle cx="110" cy="92" r="13" fill="%s"/>' % BLK +
  '<path d="M110 106 V150 M110 118 L140 138 M110 150 L92 184 M110 150 L128 184" stroke="%s" stroke-width="10" fill="none" stroke-linecap="round"/>' % BLK +
  '<path d="M138 110 L158 150 H118 Z" fill="%s" opacity=".0"/>' % BLK +
  '<rect x="120" y="150" width="44" height="34" fill="%s"/>' % BLK)
SIGNS['accident_ahead'] = tri_sym(
  car(70, BLK, 38, 58).replace('74','96').replace('84','106') +
  '<g transform="rotate(18 150 150)">' + car(124, RED, 38, 58).replace('74','96').replace('84','106') + '</g>')
SIGNS['fog'] = tri_sym(
  car(88, BLK, 44, 40).replace('"74"','"96"').replace('"84"','"104"') +
  '<path d="M64 150 h92 M58 168 h104 M70 186 h80" stroke="%s" stroke-width="8" stroke-linecap="round"/>' % BLK)
SIGNS['cyclists'] = tri_sym(
  '<circle cx="80" cy="158" r="20" fill="none" stroke="%s" stroke-width="9"/>' % BLK +
  '<circle cx="146" cy="158" r="20" fill="none" stroke="%s" stroke-width="9"/>' % BLK +
  '<path d="M80 158 L104 118 H132 M104 118 L146 158 M104 118 L86 158" stroke="%s" stroke-width="9" fill="none" stroke-linecap="round"/>' % BLK +
  '<rect x="98" y="108" width="34" height="8" fill="%s"/>' % BLK)
SIGNS['gravel_ahead'] = tri_sym(
  '<rect x="62" y="150" width="46" height="26" fill="%s"/>' % BLK +
  '<g fill="%s"><circle cx="120" cy="158" r="4"/><circle cx="134" cy="168" r="4"/><circle cx="148" cy="156" r="4"/><circle cx="128" cy="176" r="3"/><circle cx="146" cy="176" r="3"/><circle cx="116" cy="172" r="3"/></g>' % BLK)
SIGNS['traffic_light_ahead'] = tri_sym(
  '<rect x="92" y="96" width="36" height="84" rx="8" fill="%s"/>' % BLK +
  '<circle cx="110" cy="114" r="10" fill="%s"/><circle cx="110" cy="138" r="10" fill="%s"/><circle cx="110" cy="162" r="10" fill="%s"/>' % (RED, AMB, GRN))
SIGNS['steep_descent'] = tri_sym(
  '<path d="M66 110 L156 184" stroke="%s" stroke-width="11" stroke-linecap="round"/>' % BLK +
  txt('10%', y=132, size=30, x=96))

# information / direction
SIGNS['direction'] = '<rect x="10" y="74" width="150" height="72" fill="%s"/><path d="M160 74 L210 110 L160 146 Z" fill="%s"/>' % (BLU, BLU) + \
  '<path d="M40 110 H150 M120 86 L150 110 L120 134" stroke="%s" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % WHT
SIGNS['dual_carriageway_begins'] = rect(BLU) + \
  '<rect x="103" y="58" width="14" height="104" fill="%s"/>' % BLK + \
  '<path d="M74 150 V96 M74 96 L60 116 M74 96 L88 116" stroke="%s" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % WHT + \
  '<path d="M146 150 V96 M146 96 L132 116 M146 96 L160 116" stroke="%s" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % WHT
SIGNS['single_carriageway_freeway'] = rect(BLU) + \
  '<path d="M110 156 V84 M110 84 L88 112 M110 84 L132 112" stroke="%s" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' % WHT

# give way / stop
SIGNS['give_way'] = '<path d="M110 196 L18 30 Q14 22 26 22 L194 22 Q206 22 202 30 Z" fill="%s" stroke="%s" stroke-width="18" stroke-linejoin="round"/>' % (WHT, RED)
SIGNS['stop'] = '<path d="M70 18 H150 L202 70 V150 L150 202 H70 L18 150 V70 Z" fill="%s"/>' % RED + txt('STOP', y=126, size=46, fill=WHT)

# traffic light with green left-filter arrow
SIGNS['traffic_left_filter'] = \
  '<rect x="66" y="20" width="60" height="160" rx="16" fill="%s"/>' % BLK + \
  '<circle cx="96" cy="52" r="20" fill="%s" opacity=".25"/>' % RED + \
  '<circle cx="96" cy="100" r="20" fill="%s" opacity=".25"/>' % AMB + \
  '<circle cx="96" cy="148" r="20" fill="%s"/>' % GRN + \
  '<g transform="translate(150 148)"><circle r="26" fill="%s"/><path d="M14 -12 H-6 V-22 L-26 0 L-6 22 V12 H14 Z" fill="#0b3d24"/></g>' % GRN

for name, inner in SIGNS.items():
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(svg(inner))
print("generated", len(SIGNS), "sign SVGs")

# ---------- attach to questions by answer ----------
ANSWERS = {
 'no_uturn': ["prohibited from making a u turn"],
 'about_turn': ["an about turn is prohibited"],
 'no_left_turn': ["left turn not allowed"],
 'no_overtaking': ["overtaking prohibited"],
 'no_overtaking_heavy': ["heavy goods vehicles may not overtake another goods vehicle"],
 'no_hitchhiking': ["hitch hiking prohibited"],
 'no_parking': ["may not park my vehicle"],
 'no_stopping': ["stopping is prohibited"],
 'speed_80': ["speed limit on this road is 80 km h"],
 'height_restriction': ["height restriction"],
 'width_restriction': ["width restriction"],
 'length_restriction': ["warns of length restriction of 15m"],
 'bus_regulatory': ["buses are being regulated"],
 'bus_lane': ["lane reserved for buses"],
 'disabled_parking': ["parking for vehicles of disabled"],
 'road_narrows_left': ["road narrows to the left"],
 'narrow_bridge': ["narrow bridge ahead"],
 'hump': ["a hump in the road ahead"],
 'loose_stones': ["loose stones in road ahead"],
 'road_works': ["road works ahead"],
 'accident_ahead': ["warned of accident ahead"],
 'fog': ["reduced visibility in the road ahead"],
 'cyclists': ["danger of cyclists ahead", "motorists warned of presence of cyclist ahead"],
 'gravel_ahead': ["tarred road about to end and gravel road ahead"],
 'traffic_light_ahead': ["traffic light presence ahead"],
 'steep_descent': ["engage a lower gear", "engage lower gear", "engage low gear"],
 'direction': ["direction"],
 'dual_carriageway_begins': ["dual carriage free way begins here"],
 'single_carriageway_freeway': ["sign that a single carriageway freeway begins here"],
 'give_way': ["slow down and proceed if there is no traffic", "slow down and proceed if there is no crossing traffic"],
 'stop': ["stop and only proceed when the road is clear on both sides"],
 'traffic_left_filter': ["traffic turning to the left may filter if the road is clear"],
}
ans2sign = {}
for name, lst in ANSWERS.items():
    for a in lst: ans2sign[a] = name

def norm(s): return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9 ]',' ',s.lower())).strip()
def corr(q): return next((o['text'] for o in q['options'] if o['correct']), '')

vid = json.load(open("questions.json", encoding="utf-8"))
added = 0
for q in vid:
    if q.get("image"): continue
    t = q["question"].lower()
    if "sign" not in t and "traffic light" not in t: continue
    key = norm(corr(q))
    if key in ans2sign:
        q["image"] = "img/signs/%s.svg" % ans2sign[key]
        added += 1
print("attached drawn signs to", added, "questions")

json.dump(vid, open("questions.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open("data.js", "w", encoding="utf-8") as f:
    f.write("window.QUIZ_DATA = "); json.dump(vid, f, ensure_ascii=False); f.write(";")
print("total with image now:", sum(1 for q in vid if q.get("image")), "/", len(vid))
