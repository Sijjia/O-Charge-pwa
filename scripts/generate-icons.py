#!/usr/bin/env python3
"""Generate Red Petroleum EV PWA icons."""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

# Red Petroleum brand colors
BG_COLOR = (220, 38, 38)      # Red-600
BG_DARK = (185, 28, 28)       # Red-700
WHITE = (255, 255, 255)
BOLT_COLOR = (250, 204, 21)   # Yellow-400

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def draw_icon(size, maskable=False):
    """Draw a Red Petroleum EV charging icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background
    padding = int(size * 0.1) if maskable else 0
    corner_radius = int(size * 0.18)

    # Rounded rect background
    draw.rounded_rectangle(
        [padding, padding, size - padding - 1, size - padding - 1],
        radius=corner_radius,
        fill=BG_COLOR
    )

    # Inner area
    cx, cy = size // 2, size // 2

    # Draw a charging bolt ⚡
    bolt_scale = size / 512.0
    safe_zone = int(size * 0.15) if maskable else 0

    # Bolt shape (centered, scaled)
    bolt_points = [
        (210, 80), (160, 260), (240, 240),
        (200, 440), (360, 200), (270, 220), (310, 80)
    ]
    scaled_bolt = [(int(x * bolt_scale) + safe_zone // 4, int(y * bolt_scale) + safe_zone // 4) for x, y in bolt_points]

    draw.polygon(scaled_bolt, fill=WHITE)

    # "RP" text at bottom
    font_size = int(size * 0.14)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/SFNSDisplay.ttf", font_size)
        except:
            font = ImageFont.load_default()

    text = "RP"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = size - int(size * 0.22) - safe_zone // 2
    draw.text((tx, ty), text, fill=(255, 255, 255, 200), font=font)

    return img


def draw_favicon(size=32):
    """Small favicon — just bolt on red."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=6, fill=BG_COLOR)

    # Simple bolt
    s = size / 32.0
    bolt = [
        (13*s, 3*s), (8*s, 16*s), (15*s, 14*s),
        (11*s, 29*s), (24*s, 12*s), (17*s, 14*s), (21*s, 3*s)
    ]
    draw.polygon([(int(x), int(y)) for x, y in bolt], fill=WHITE)
    return img


if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate all PWA icon sizes
    for size in SIZES:
        # Regular icon
        icon = draw_icon(size, maskable=False)
        path = os.path.join(OUTPUT_DIR, f'icon-{size}x{size}.png')
        icon.save(path, 'PNG')
        print(f'  ✅ {path}')

        # Maskable icons for 192 and 512
        if size in (192, 512):
            maskable = draw_icon(size, maskable=True)
            path_m = os.path.join(OUTPUT_DIR, f'icon-{size}x{size}-maskable.png')
            maskable.save(path_m, 'PNG')
            print(f'  ✅ {path_m}')

    # manifest-icon-192.maskable.png
    maskable_192 = draw_icon(192, maskable=True)
    maskable_192.save(os.path.join(OUTPUT_DIR, 'manifest-icon-192.maskable.png'), 'PNG')
    print(f'  ✅ manifest-icon-192.maskable.png')

    # Favicon
    fav = draw_favicon(32)
    fav.save(os.path.join(PUBLIC_DIR, 'favicon.png'), 'PNG')
    print(f'  ✅ favicon.png')

    # Apple touch icon (180x180)
    apple = draw_icon(180, maskable=False)
    apple.save(os.path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 'PNG')
    print(f'  ✅ apple-touch-icon.png')

    print('\n🎉 Все иконки сгенерированы!')
