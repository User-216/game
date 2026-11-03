from PIL import Image, ImageDraw
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 256x256 tileset (8 columns x 8 rows, each 32x32)
TILE_SIZE = 32
COLS = 8
ROWS = 8
W, H = COLS * TILE_SIZE, ROWS * TILE_SIZE
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Exact colors sampled from Pig City screenshot:
C_TOP_BASE   = (142, 76, 98, 255)   # #8e4c62 Top sidewalk plane
C_TOP_LIGHT  = (159, 87, 110, 255)  # #9f576e Top subtle highlight
C_TOP_DARK   = (112, 56, 76, 255)   # #70384c Seam shadow on top
C_CURB_FACE  = (79, 38, 67, 255)    # #4f2643 Front vertical curb face
C_CURB_LIGHT = (95, 48, 80, 255)    # #5f3050 Front face highlight
C_CURB_DARK  = (53, 24, 44, 255)    # #35182c Front face bottom shadow
C_OUTLINE    = (22, 10, 18, 255)    # #160a12 Pizza Tower thick ink outline
C_NOTCH_FILL = (34, 14, 28, 255)    # #220e1c Diamond bevel cavity shadow

# Road asphalt palette:
C_ROAD_BASE  = (65, 33, 54, 255)    # #412136 Asphalt surface
C_ROAD_DARK  = (47, 22, 39, 255)    # #2f1627 Asphalt speckles & cracks
C_ROAD_LIGHT = (78, 40, 65, 255)    # #4e2841 Asphalt top rim
C_WHITE_LINE = (248, 246, 248, 255) # #f8f6f8 White road dashes
C_WHITE_SHAD = (160, 148, 160, 255) # #a094a0 Road dash 3D bevel shadow

# Brick foundation palette:
C_BRICK_BASE = (58, 28, 48, 255)    # #3a1c30 Brick face
C_BRICK_HIGH = (74, 36, 61, 255)    # #4a243d Brick upper edge
C_BRICK_SHAD = (42, 18, 34, 255)    # #2a1222 Brick lower edge

def draw_notch(cx, cy):
    diamond = [
        (cx, cy - 3),
        (cx + 3, cy),
        (cx, cy + 3),
        (cx - 3, cy)
    ]
    draw.polygon(diamond, fill=C_NOTCH_FILL, outline=C_OUTLINE)
    draw.point((cx, cy), fill=C_NOTCH_FILL)

def draw_bottom_curb_notch(cx, y_bottom):
    draw.polygon([
        (cx - 2, y_bottom),
        (cx, y_bottom - 2),
        (cx + 2, y_bottom)
    ], fill=C_OUTLINE)

def draw_sidewalk_base(tx, ty):
    x0, y0 = tx * 32, ty * 32
    # Top walking plane (18px high)
    draw.rectangle([x0, y0, x0 + 31, y0 + 17], fill=C_TOP_BASE)
    draw.line([x0, y0, x0 + 31, y0], fill=C_TOP_LIGHT)
    draw.line([x0, y0 + 16, x0 + 31, y0 + 16], fill=C_TOP_LIGHT)
    
    # Curb dividing edge line (y0+17)
    draw.line([x0, y0 + 17, x0 + 31, y0 + 17], fill=C_OUTLINE)
    
    # Front vertical curb face (13px high)
    draw.rectangle([x0, y0 + 18, x0 + 31, y0 + 30], fill=C_CURB_FACE)
    draw.line([x0, y0 + 30, x0 + 31, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0, y0 + 31, x0 + 31, y0 + 31], fill=C_OUTLINE)

# ==========================================
# ROW 0: 2.5D SIDEWALK PLATFORMS (32x32)
# ==========================================

def draw_sidewalk_left(tx=0, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0, y0, x0, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 1, y0 + 18, x0 + 1, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0 + 2, y0 + 18, x0 + 2, y0 + 30], fill=C_CURB_DARK)
    draw.point((x0 + 1, y0 + 1), fill=C_TOP_LIGHT)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_seam_mid(tx=1, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    sx = x0 + 16
    cy = y0 + 17
    draw.line([sx - 1, y0, sx, y0 + 8], fill=C_OUTLINE)
    draw.line([sx, y0 + 8, sx, cy - 3], fill=C_OUTLINE)
    draw.line([sx + 1, y0, sx + 1, cy - 4], fill=C_TOP_DARK)
    draw_notch(sx, cy)
    draw.line([sx, cy + 4, sx, y0 + 30], fill=C_OUTLINE)
    draw.line([sx + 1, cy + 4, sx + 1, y0 + 30], fill=C_CURB_DARK)
    draw_bottom_curb_notch(sx, y0 + 31)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_clean(tx=2, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0 + 8, y0 + 5, x0 + 14, y0 + 9], fill=C_OUTLINE)
    draw.line([x0 + 14, y0 + 9, x0 + 19, y0 + 8], fill=C_TOP_DARK)
    draw.point((x0 + 25, y0 + 24), fill=C_CURB_DARK)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_drain(tx=3, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.rectangle([x0 + 4, y0 + 19, x0 + 27, y0 + 29], fill=C_OUTLINE)
    draw.rectangle([x0 + 5, y0 + 20, x0 + 26, y0 + 28], fill=(18, 9, 16, 255))
    for bx in range(x0 + 7, x0 + 26, 4):
        draw.line([bx, y0 + 20, bx, y0 + 28], fill=(135, 125, 140, 255))
        draw.point((bx, y0 + 20), fill=(190, 180, 195, 255))
        draw.point((bx + 1, y0 + 21), fill=(75, 70, 80, 255))
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_border_seams(tx=4, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    cy = y0 + 17
    draw.line([x0, y0, x0, cy - 3], fill=C_OUTLINE)
    draw.polygon([(x0, cy - 3), (x0 + 3, cy), (x0, cy + 3)], fill=C_NOTCH_FILL, outline=C_OUTLINE)
    draw.line([x0, cy + 4, x0, y0 + 30], fill=C_OUTLINE)
    draw.polygon([(x0, y0 + 31), (x0 + 2, y0 + 31), (x0, y0 + 29)], fill=C_OUTLINE)
    
    draw.line([x0 + 31, y0, x0 + 31, cy - 3], fill=C_OUTLINE)
    draw.polygon([(x0 + 31, cy - 3), (x0 + 28, cy), (x0 + 31, cy + 3)], fill=C_NOTCH_FILL, outline=C_OUTLINE)
    draw.line([x0 + 31, cy + 4, x0 + 31, y0 + 30], fill=C_OUTLINE)
    draw.polygon([(x0 + 31, y0 + 31), (x0 + 29, y0 + 31), (x0 + 31, y0 + 29)], fill=C_OUTLINE)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_right(tx=5, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0 + 31, y0, x0 + 31, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 30, y0 + 18, x0 + 30, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0 + 29, y0 + 18, x0 + 29, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_island(tx=6, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0, y0, x0, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 31, y0, x0 + 31, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 1, y0 + 18, x0 + 1, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0 + 30, y0 + 18, x0 + 30, y0 + 30], fill=C_CURB_DARK)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

def draw_sidewalk_rock(tx=7, ty=0):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    rock = [(x0 + 12, y0 + 13), (x0 + 19, y0 + 8), (x0 + 25, y0 + 12), (x0 + 22, y0 + 16), (x0 + 14, y0 + 15)]
    draw.polygon(rock, fill=(115, 68, 85, 255), outline=C_OUTLINE)
    draw.line([(x0 + 19, y0 + 8), (x0 + 19, y0 + 13), (x0 + 22, y0 + 16)], fill=C_OUTLINE)
    draw.point((x0 + 16, y0 + 10), fill=(145, 90, 110, 255))
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)

# ==========================================
# ROW 1: ROAD & STREET (ASPHALT) (32x32)
# ==========================================

def draw_road_base(tx, ty):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 31], fill=C_ROAD_BASE)
    specks = [(4, 6), (19, 5), (11, 15), (27, 18), (8, 25), (23, 27)]
    for sx, sy in specks:
        draw.point((x0 + sx, y0 + sy), fill=C_ROAD_DARK)

def draw_road_plain(tx=0, ty=1):
    draw_road_base(tx, ty)

def draw_road_dash_center(tx=1, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    draw.rectangle([x0 + 7, y0 + 13, x0 + 24, y0 + 16], fill=C_WHITE_LINE, outline=C_OUTLINE)
    draw.line([x0 + 7, y0 + 17, x0 + 24, y0 + 17], fill=C_WHITE_SHAD)

def draw_road_dash_left(tx=2, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    draw.rectangle([x0, y0 + 13, x0 + 12, y0 + 16], fill=C_WHITE_LINE, outline=C_OUTLINE)
    draw.line([x0, y0 + 17, x0 + 12, y0 + 17], fill=C_WHITE_SHAD)

def draw_road_dash_right(tx=3, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    draw.rectangle([x0 + 19, y0 + 13, x0 + 31, y0 + 16], fill=C_WHITE_LINE, outline=C_OUTLINE)
    draw.line([x0 + 19, y0 + 17, x0 + 31, y0 + 17], fill=C_WHITE_SHAD)

def draw_road_manhole(tx=4, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    cx, cy, r = x0 + 16, y0 + 16, 12
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(75, 58, 72, 255), outline=C_OUTLINE)
    draw.ellipse([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], outline=C_OUTLINE)
    draw.line([cx - 8, cy, cx + 8, cy], fill=C_OUTLINE)
    draw.line([cx, cy - 8, cx, cy + 8], fill=C_OUTLINE)
    draw.point((cx - 4, cy - 4), fill=(125, 110, 125, 255))
    draw.point((cx + 4, cy - 4), fill=(125, 110, 125, 255))
    draw.point((cx - 4, cy + 4), fill=(40, 25, 38, 255))
    draw.point((cx + 4, cy + 4), fill=(40, 25, 38, 255))

def draw_road_rock(tx=5, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    rock = [(x0 + 10, y0 + 18), (x0 + 17, y0 + 13), (x0 + 24, y0 + 17), (x0 + 21, y0 + 24), (x0 + 12, y0 + 23)]
    draw.polygon(rock, fill=(110, 65, 82, 255), outline=C_OUTLINE)
    draw.line([(x0 + 17, y0 + 13), (x0 + 17, y0 + 19), (x0 + 21, y0 + 24)], fill=C_OUTLINE)
    draw.line([(x0 + 10, y0 + 18), (x0 + 17, y0 + 19)], fill=C_OUTLINE)
    draw.point((x0 + 14, y0 + 15), fill=(140, 85, 105, 255))

def draw_road_puddle(tx=6, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    puddle = [(x0 + 6, y0 + 17), (x0 + 14, y0 + 14), (x0 + 25, y0 + 16), (x0 + 27, y0 + 21), (x0 + 18, y0 + 25), (x0 + 9, y0 + 23)]
    draw.polygon(puddle, fill=(195, 120, 28, 255), outline=C_OUTLINE)
    draw.line([x0 + 10, y0 + 16, x0 + 21, y0 + 17], fill=(235, 165, 45, 255))
    draw.point((x0 + 12, y0 + 15), fill=(255, 215, 110, 255))

def draw_road_grate(tx=7, ty=1):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    draw.rectangle([x0 + 4, y0 + 8, x0 + 27, y0 + 23], fill=(25, 12, 22, 255), outline=C_OUTLINE)
    for gx in range(x0 + 7, x0 + 26, 3):
        draw.line([gx, y0 + 9, gx, y0 + 22], fill=(130, 120, 130, 255))

# ==========================================
# ROW 2: BRICK FOUNDATION & UNDERGROUND (32x32)
# ==========================================

def draw_brick_pattern(tx, ty):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 31], fill=C_BRICK_BASE)
    draw.line([x0, y0 + 15, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 16, y0, x0 + 16, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 1, y0 + 1, x0 + 15, y0 + 1], fill=C_BRICK_HIGH)
    draw.line([x0 + 17, y0 + 1, x0 + 30, y0 + 1], fill=C_BRICK_HIGH)
    draw.line([x0 + 1, y0 + 14, x0 + 15, y0 + 14], fill=C_BRICK_SHAD)
    draw.line([x0 + 17, y0 + 14, x0 + 30, y0 + 14], fill=C_BRICK_SHAD)
    
    draw.line([x0, y0 + 31, x0 + 31, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 8, y0 + 16, x0 + 8, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 24, y0 + 16, x0 + 24, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 1, y0 + 17, x0 + 7, y0 + 17], fill=C_BRICK_HIGH)
    draw.line([x0 + 9, y0 + 17, x0 + 23, y0 + 17], fill=C_BRICK_HIGH)
    draw.line([x0 + 25, y0 + 17, x0 + 30, y0 + 17], fill=C_BRICK_HIGH)
    draw.line([x0 + 9, y0 + 30, x0 + 23, y0 + 30], fill=C_BRICK_SHAD)

def draw_brick_left(tx=0, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.line([x0, y0, x0, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 1, y0, x0 + 1, y0 + 31], fill=C_BRICK_SHAD)

def draw_brick_mid(tx=1, ty=2):
    draw_brick_pattern(tx, ty)

def draw_brick_poster(tx=2, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.rectangle([x0 + 10, y0 + 6, x0 + 23, y0 + 22], fill=(225, 215, 185, 255), outline=C_OUTLINE)
    draw.line([x0 + 12, y0 + 9, x0 + 21, y0 + 9], fill=(160, 40, 40, 255))
    draw.rectangle([x0 + 13, y0 + 12, x0 + 19, y0 + 17], fill=(60, 45, 55, 255))
    draw.line([x0 + 12, y0 + 19, x0 + 20, y0 + 19], fill=C_OUTLINE)

def draw_brick_right(tx=3, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.line([x0 + 31, y0, x0 + 31, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 30, y0, x0 + 30, y0 + 31], fill=C_BRICK_SHAD)

def draw_brick_pipe(tx=4, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.rectangle([x0, y0 + 10, x0 + 31, y0 + 21], fill=(85, 95, 95, 255), outline=C_OUTLINE)
    draw.line([x0, y0 + 11, x0 + 31, y0 + 11], fill=(130, 145, 145, 255))
    draw.line([x0, y0 + 20, x0 + 31, y0 + 20], fill=(50, 60, 60, 255))
    draw.rectangle([x0 + 13, y0 + 8, x0 + 18, y0 + 23], fill=(100, 110, 110, 255), outline=C_OUTLINE)

def draw_brick_slime(tx=5, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    drip = [(x0 + 12, y0), (x0 + 20, y0), (x0 + 20, y0 + 9), (x0 + 16, y0 + 15), (x0 + 13, y0 + 9)]
    draw.polygon(drip, fill=(75, 145, 65, 255), outline=C_OUTLINE)
    draw.point((x0 + 15, y0 + 5), fill=(115, 195, 95, 255))

def draw_brick_deep(tx=6, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 31], fill=(38, 18, 32, 255))
    draw.line([x0, y0 + 15, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.line([x0, y0 + 31, x0 + 31, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 16, y0, x0 + 16, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 8, y0 + 16, x0 + 8, y0 + 31], fill=C_OUTLINE)

def draw_brick_column(tx=7, ty=2):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.line([x0, y0, x0, y0 + 31], fill=C_OUTLINE)
    draw.line([x0 + 31, y0, x0 + 31, y0 + 31], fill=C_OUTLINE)

# ==========================================
# ROW 3: 2.5D SLOPES, PLATFORMS & OBJECTS (32x32)
# ==========================================

def draw_slope_left_up(tx=0, ty=3):
    x0, y0 = tx * 32, ty * 32
    ramp = [
        (x0, y0 + 22), (x0 + 31, y0),
        (x0 + 31, y0 + 13), (x0, y0 + 31)
    ]
    draw.polygon(ramp, fill=C_TOP_BASE)
    draw.line([(x0, y0 + 22), (x0 + 31, y0)], fill=C_TOP_LIGHT)
    
    front = [
        (x0, y0 + 31), (x0 + 31, y0 + 14),
        (x0 + 31, y0 + 31), (x0, y0 + 31)
    ]
    draw.polygon(front, fill=C_CURB_FACE)
    draw.line([(x0, y0 + 31), (x0 + 31, y0 + 14)], fill=C_OUTLINE)
    draw.line([(x0, y0 + 31), (x0 + 31, y0 + 31)], fill=C_OUTLINE)
    draw.line([(x0 + 31, y0), (x0 + 31, y0 + 31)], fill=C_OUTLINE)
    draw.line([(x0, y0 + 22), (x0 + 31, y0)], fill=C_OUTLINE)

def draw_slope_right_up(tx=1, ty=3):
    x0, y0 = tx * 32, ty * 32
    ramp = [
        (x0, y0), (x0 + 31, y0 + 22),
        (x0 + 31, y0 + 31), (x0, y0 + 13)
    ]
    draw.polygon(ramp, fill=C_TOP_BASE)
    draw.line([(x0, y0), (x0 + 31, y0 + 22)], fill=C_TOP_LIGHT)
    
    front = [
        (x0, y0 + 14), (x0 + 31, y0 + 31),
        (x0, y0 + 31)
    ]
    draw.polygon(front, fill=C_CURB_FACE)
    draw.line([(x0, y0 + 14), (x0 + 31, y0 + 31)], fill=C_OUTLINE)
    draw.line([(x0, y0), (x0, y0 + 31)], fill=C_OUTLINE)
    draw.line([(x0, y0 + 31), (x0 + 31, y0 + 31)], fill=C_OUTLINE)
    draw.line([(x0, y0), (x0 + 31, y0 + 22)], fill=C_OUTLINE)

def draw_thin_platform_mid(tx=2, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 7], fill=C_TOP_BASE)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)
    draw.line([x0, y0 + 7, x0 + 31, y0 + 7], fill=C_OUTLINE)
    draw.rectangle([x0, y0 + 8, x0 + 31, y0 + 15], fill=C_CURB_FACE)
    draw.line([x0, y0 + 15, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.polygon([(x0 + 14, y0 + 6), (x0 + 16, y0 + 9), (x0 + 18, y0 + 6)], fill=C_NOTCH_FILL, outline=C_OUTLINE)

def draw_thin_platform_left(tx=3, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 7], fill=C_TOP_BASE)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)
    draw.line([x0, y0 + 7, x0 + 31, y0 + 7], fill=C_OUTLINE)
    draw.rectangle([x0, y0 + 8, x0 + 31, y0 + 15], fill=C_CURB_FACE)
    draw.line([x0, y0 + 15, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.line([x0, y0, x0, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 1, y0 + 8, x0 + 1, y0 + 14], fill=C_CURB_DARK)

def draw_thin_platform_right(tx=4, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw.rectangle([x0, y0, x0 + 31, y0 + 7], fill=C_TOP_BASE)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)
    draw.line([x0, y0 + 7, x0 + 31, y0 + 7], fill=C_OUTLINE)
    draw.rectangle([x0, y0 + 8, x0 + 31, y0 + 15], fill=C_CURB_FACE)
    draw.line([x0, y0 + 15, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 31, y0, x0 + 31, y0 + 15], fill=C_OUTLINE)
    draw.line([x0 + 30, y0 + 8, x0 + 30, y0 + 14], fill=C_CURB_DARK)

def draw_traffic_cone(tx=5, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_clean(tx, ty)
    cone_base = [(x0 + 8, y0 + 15), (x0 + 24, y0 + 15), (x0 + 22, y0 + 17), (x0 + 10, y0 + 17)]
    draw.polygon(cone_base, fill=(40, 20, 25, 255), outline=C_OUTLINE)
    cone_body = [(x0 + 11, y0 + 15), (x0 + 15, y0 + 2), (x0 + 17, y0 + 2), (x0 + 21, y0 + 15)]
    draw.polygon(cone_body, fill=(245, 110, 20, 255), outline=C_OUTLINE)
    draw.polygon([(x0 + 13, y0 + 10), (x0 + 14, y0 + 6), (x0 + 18, y0 + 6), (x0 + 19, y0 + 10)], fill=C_WHITE_LINE, outline=C_OUTLINE)

def draw_fire_hydrant(tx=6, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_clean(tx, ty)
    draw.rectangle([x0 + 12, y0 + 5, x0 + 20, y0 + 16], fill=(215, 45, 45, 255), outline=C_OUTLINE)
    draw.ellipse([x0 + 11, y0 + 2, x0 + 21, y0 + 7], fill=(235, 70, 70, 255), outline=C_OUTLINE)
    draw.rectangle([x0 + 14, y0 + 1, x0 + 18, y0 + 3], fill=(240, 200, 50, 255), outline=C_OUTLINE)
    draw.rectangle([x0 + 9, y0 + 8, x0 + 12, y0 + 12], fill=(240, 200, 50, 255), outline=C_OUTLINE)
    draw.rectangle([x0 + 20, y0 + 8, x0 + 23, y0 + 12], fill=(240, 200, 50, 255), outline=C_OUTLINE)

def draw_parking_meter(tx=7, ty=3):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_clean(tx, ty)
    draw.rectangle([x0 + 14, y0 + 6, x0 + 17, y0 + 16], fill=(130, 130, 140, 255), outline=C_OUTLINE)
    draw.ellipse([x0 + 11, y0 + 1, x0 + 20, y0 + 8], fill=(90, 100, 115, 255), outline=C_OUTLINE)
    draw.rectangle([x0 + 13, y0 + 3, x0 + 18, y0 + 6], fill=(230, 240, 245, 255), outline=C_OUTLINE)

# ==========================================
# ROW 4: ROAD SPECIALS & SIDEWALK PROPS (32x32)
# ==========================================

# Tile (0, 4): Pedestrian Zebra Crosswalk
def draw_road_crosswalk(tx=0, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    # 4 vertical zebra stripes
    for zx in [x0 + 2, x0 + 10, x0 + 18, x0 + 26]:
        draw.rectangle([zx, y0 + 2, zx + 4, y0 + 29], fill=C_WHITE_LINE, outline=C_OUTLINE)
        draw.line([zx, y0 + 29, zx + 4, y0 + 29], fill=C_WHITE_SHAD)

# Tile (1, 4): Double Yellow Center Line
def draw_road_double_yellow(tx=1, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    c_yellow = (235, 185, 30, 255)
    c_y_shad = (165, 120, 20, 255)
    draw.rectangle([x0, y0 + 12, x0 + 31, y0 + 14], fill=c_yellow, outline=C_OUTLINE)
    draw.line([x0, y0 + 14, x0 + 31, y0 + 14], fill=c_y_shad)
    draw.rectangle([x0, y0 + 17, x0 + 31, y0 + 19], fill=c_yellow, outline=C_OUTLINE)
    draw.line([x0, y0 + 19, x0 + 31, y0 + 19], fill=c_y_shad)

# Tile (2, 4): Tire Skid Mark on Road
def draw_road_skidmark(tx=2, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    c_skid = (28, 12, 22, 255)
    draw.line([x0, y0 + 9, x0 + 31, y0 + 12], fill=c_skid)
    draw.line([x0, y0 + 10, x0 + 31, y0 + 13], fill=c_skid)
    draw.line([x0, y0 + 21, x0 + 31, y0 + 24], fill=c_skid)
    draw.line([x0, y0 + 22, x0 + 31, y0 + 25], fill=c_skid)

# Tile (3, 4): Asphalt Pothole with Cider Water
def draw_road_pothole(tx=3, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_road_base(tx, ty)
    pothole = [(x0 + 7, y0 + 11), (x0 + 15, y0 + 9), (x0 + 24, y0 + 13), (x0 + 22, y0 + 22), (x0 + 13, y0 + 24), (x0 + 6, y0 + 19)]
    draw.polygon(pothole, fill=(35, 15, 28, 255), outline=C_OUTLINE)
    inner = [(x0 + 9, y0 + 13), (x0 + 16, y0 + 11), (x0 + 21, y0 + 15), (x0 + 19, y0 + 20), (x0 + 12, y0 + 21)]
    draw.polygon(inner, fill=(195, 120, 28, 255))
    draw.line([x0 + 11, y0 + 15, x0 + 18, y0 + 14], fill=(245, 180, 50, 255))

# Tile (4, 4): Sidewalk with Litter (Newspaper & Cigarette)
def draw_sidewalk_litter(tx=4, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_clean(tx, ty)
    # Crumpled newspaper
    news = [(x0 + 6, y0 + 8), (x0 + 12, y0 + 6), (x0 + 14, y0 + 11), (x0 + 8, y0 + 12)]
    draw.polygon(news, fill=(210, 205, 200, 255), outline=C_OUTLINE)
    draw.line([x0 + 8, y0 + 8, x0 + 12, y0 + 9], fill=C_OUTLINE)
    # Cigarette butt
    draw.line([x0 + 20, y0 + 13, x0 + 23, y0 + 13], fill=(230, 230, 230, 255))
    draw.point((x0 + 24, y0 + 13), fill=(210, 110, 30, 255))

# Tile (5, 4): Sidewalk Manhole Slab
def draw_sidewalk_manhole(tx=5, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_clean(tx, ty)
    cx, cy, rx, ry = x0 + 16, y0 + 9, 10, 5
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(70, 50, 65, 255), outline=C_OUTLINE)
    draw.ellipse([cx - rx + 2, cy - ry + 1, cx + rx - 2, cy + ry - 1], outline=C_OUTLINE)
    draw.line([cx - 5, cy, cx + 5, cy], fill=C_OUTLINE)

# Tile (6, 4): Sidewalk Caution Curb (Diagonal yellow/black hazard stripes on curb face)
def draw_sidewalk_hazard(tx=6, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)
    # Fill curb face with yellow/black hazard stripes
    c_haz_y = (240, 205, 35, 255)
    c_haz_k = (25, 12, 20, 255)
    for x in range(32):
        for y in range(18, 31):
            if ((x + y) // 5) % 2 == 0:
                draw.point((x0 + x, y0 + y), fill=c_haz_y)
            else:
                draw.point((x0 + x, y0 + y), fill=c_haz_k)
    draw.line([x0, y0 + 17, x0 + 31, y0 + 17], fill=C_OUTLINE)
    draw.line([x0, y0 + 31, x0 + 31, y0 + 31], fill=C_OUTLINE)

# Tile (7, 4): Sidewalk Heavily Fractured Slab
def draw_sidewalk_cracked(tx=7, ty=4):
    x0, y0 = tx * 32, ty * 32
    draw_sidewalk_base(tx, ty)
    draw.line([x0, y0, x0 + 31, y0], fill=C_OUTLINE)
    # Big jagged crack branching across top and curb
    draw.line([x0 + 14, y0, x0 + 18, y0 + 6], fill=C_OUTLINE)
    draw.line([x0 + 18, y0 + 6, x0 + 15, y0 + 12], fill=C_OUTLINE)
    draw.line([x0 + 15, y0 + 12, x0 + 20, y0 + 17], fill=C_OUTLINE)
    draw.line([x0 + 20, y0 + 17, x0 + 18, y0 + 24], fill=C_OUTLINE)
    draw.line([x0 + 18, y0 + 24, x0 + 22, y0 + 30], fill=C_OUTLINE)
    draw.line([x0 + 15, y0 + 12, x0 + 9, y0 + 16], fill=C_OUTLINE)


# ==========================================
# ROW 5: SEWER & UNDERGROUND ARCH (32x32)
# ==========================================

# Tile (0, 5): Sewer Culvert Arch Left
def draw_sewer_arch_left(tx=0, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    # Left arch cutout into deep black
    draw.pieslice([x0, y0 - 16, x0 + 63, y0 + 47], 90, 180, fill=(15, 6, 12, 255), outline=C_OUTLINE)
    draw.arc([x0, y0 - 16, x0 + 63, y0 + 47], 90, 180, fill=C_BRICK_HIGH, width=2)

# Tile (1, 5): Sewer Culvert Arch Right
def draw_sewer_arch_right(tx=1, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    # Right arch cutout
    draw.pieslice([x0 - 32, y0 - 16, x0 + 31, y0 + 47], 0, 90, fill=(15, 6, 12, 255), outline=C_OUTLINE)
    draw.arc([x0 - 32, y0 - 16, x0 + 31, y0 + 47], 0, 90, fill=C_BRICK_HIGH, width=2)

# Tile (2, 5): Brick Wall with Sewer Ladder Rungs
def draw_brick_ladder(tx=2, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    # Ladder rungs (3 iron bars)
    for ry in [y0 + 5, y0 + 15, y0 + 25]:
        draw.line([x0 + 8, ry, x0 + 23, ry], fill=C_OUTLINE)
        draw.line([x0 + 8, ry - 1, x0 + 23, ry - 1], fill=(160, 170, 180, 255))
        draw.point((x0 + 8, ry + 1), fill=(70, 75, 80, 255))
        draw.point((x0 + 23, ry + 1), fill=(70, 75, 80, 255))

# Tile (3, 5): Vertical Iron Sewer Pipe
def draw_pipe_vertical(tx=3, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.rectangle([x0 + 10, y0, x0 + 21, y0 + 31], fill=(85, 95, 95, 255), outline=C_OUTLINE)
    draw.line([x0 + 12, y0, x0 + 12, y0 + 31], fill=(135, 150, 150, 255))
    draw.line([x0 + 20, y0, x0 + 20, y0 + 31], fill=(50, 60, 60, 255))
    # Pipe ring connector
    draw.rectangle([x0 + 8, y0 + 13, x0 + 23, y0 + 18], fill=(105, 115, 115, 255), outline=C_OUTLINE)

# Tile (4, 5): Pipe Elbow / Corner
def draw_pipe_elbow(tx=4, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    # Horizontal segment from left to center
    draw.rectangle([x0, y0 + 10, x0 + 21, y0 + 21], fill=(85, 95, 95, 255), outline=C_OUTLINE)
    # Vertical segment down
    draw.rectangle([x0 + 10, y0 + 10, x0 + 21, y0 + 31], fill=(85, 95, 95, 255), outline=C_OUTLINE)
    draw.rectangle([x0 + 9, y0 + 9, x0 + 22, y0 + 22], fill=(105, 115, 115, 255), outline=C_OUTLINE)

# Tile (5, 5): Sewer Valve Handwheel
def draw_sewer_valve(tx=5, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pipe(tx, ty)
    cx, cy, r = x0 + 16, y0 + 16, 8
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(190, 40, 40, 255), outline=C_OUTLINE)
    draw.ellipse([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], fill=(85, 95, 95, 255), outline=C_OUTLINE)
    draw.line([cx - r, cy, cx + r, cy], fill=C_OUTLINE)
    draw.line([cx, cy - r, cx, cy + r], fill=C_OUTLINE)
    draw.point((cx, cy), fill=(230, 200, 50, 255))

# Tile (6, 5): Heavy Sewer Bar Grate Window
def draw_sewer_grate_bars(tx=6, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    draw.rectangle([x0 + 4, y0 + 4, x0 + 27, y0 + 27], fill=(15, 6, 12, 255), outline=C_OUTLINE)
    for bx in range(x0 + 7, x0 + 26, 4):
        draw.line([bx, y0 + 4, bx, y0 + 27], fill=(140, 140, 150, 255))
        draw.point((bx + 1, y0 + 5), fill=(80, 80, 90, 255))
    draw.line([x0 + 4, y0 + 15, x0 + 27, y0 + 15], fill=(160, 160, 170, 255))

# Tile (7, 5): Caution Graffiti / Warning Plaque
def draw_warning_sign(tx=7, ty=5):
    x0, y0 = tx * 32, ty * 32
    draw_brick_pattern(tx, ty)
    # Diamond yellow warning sign
    cx, cy, r = x0 + 16, y0 + 16, 10
    diamond = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    draw.polygon(diamond, fill=(240, 205, 30, 255), outline=C_OUTLINE)
    # Exclamation mark inside
    draw.line([cx, cy - 5, cx, cy + 1], fill=C_OUTLINE, width=2)
    draw.point((cx, cy + 5), fill=C_OUTLINE)


# ==========================================
# RENDER TILES ON 8x8 GRID
# ==========================================

# Row 0: Sidewalks
draw_sidewalk_left(0, 0)
draw_sidewalk_seam_mid(1, 0)
draw_sidewalk_clean(2, 0)
draw_sidewalk_drain(3, 0)
draw_sidewalk_border_seams(4, 0)
draw_sidewalk_right(5, 0)
draw_sidewalk_island(6, 0)
draw_sidewalk_rock(7, 0)

# Row 1: Road & Asphalt
draw_road_plain(0, 1)
draw_road_dash_center(1, 1)
draw_road_dash_left(2, 1)
draw_road_dash_right(3, 1)
draw_road_manhole(4, 1)
draw_road_rock(5, 1)
draw_road_puddle(6, 1)
draw_road_grate(7, 1)

# Row 2: Brick Foundations
draw_brick_left(0, 2)
draw_brick_mid(1, 2)
draw_brick_poster(2, 2)
draw_brick_right(3, 2)
draw_brick_pipe(4, 2)
draw_brick_slime(5, 2)
draw_brick_deep(6, 2)
draw_brick_column(7, 2)

# Row 3: Slopes, Platforms & Objects
draw_slope_left_up(0, 3)
draw_slope_right_up(1, 3)
draw_thin_platform_mid(2, 3)
draw_thin_platform_left(3, 3)
draw_thin_platform_right(4, 3)
draw_traffic_cone(5, 3)
draw_fire_hydrant(6, 3)
draw_parking_meter(7, 3)

# Row 4: Road Specials & Sidewalk Props
draw_road_crosswalk(0, 4)
draw_road_double_yellow(1, 4)
draw_road_skidmark(2, 4)
draw_road_pothole(3, 4)
draw_sidewalk_litter(4, 4)
draw_sidewalk_manhole(5, 4)
draw_sidewalk_hazard(6, 4)
draw_sidewalk_cracked(7, 4)

# Row 5: Sewer & Underground
draw_sewer_arch_left(0, 5)
draw_sewer_arch_right(1, 5)
draw_brick_ladder(2, 5)
draw_pipe_vertical(3, 5)
draw_pipe_elbow(4, 5)
draw_sewer_valve(5, 5)
draw_sewer_grate_bars(6, 5)
draw_warning_sign(7, 5)

# Rows 6 & 7: Extra variations (seamless dark road fill, deep stone)
for x in range(8):
    draw_road_plain(x, 6)
    draw_brick_deep(x, 7)

# Save master tileset
tileset_path = r'C:\Users\user\googleantigravity\Tileset\tile_city.png'
img.save(tileset_path)
print("Successfully generated Tileset/tile_city.png (256x256, 8x8 tiles)")

# Generate showcase preview scaled 2x
showcase = img.resize((W * 2, H * 2), Image.NEAREST)
preview_path = r'C:\Users\user\.gemini\antigravity\brain\1423abf8-00af-42ad-bfee-df778a52c5bb\tile_city_full_showcase.png'
showcase.save(preview_path)
print("Saved full showcase to:", preview_path)
