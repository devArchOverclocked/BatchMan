#!/usr/bin/env python3
"""Generates the BatchMan extension icons: a Batman signal (yellow spotlight + black bat)."""

from PIL import Image, ImageDraw
import math, os

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    r = size / 2 - 1

    # Yellow spotlight circle
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill='#f59e0b')

    # Scale bat relative to icon size
    s = size / 128

    def pt(x, y):
        # x, y are in 128-unit space, centered at (64, 64)
        return (cx + (x - 64) * s, cy + (y - 64) * s)

    # Bat silhouette as a polygon approximation.
    # Designed on a 128x128 canvas, centered at (64, 64).
    bat = [
        # Start at top-centre, go clockwise
        pt(64, 48),   # top centre (between ears)
        pt(72, 38),   # right ear inner base
        pt(76, 28),   # right ear tip
        pt(80, 38),   # right ear outer base
        pt(100, 30),  # right wing outer tip (high)
        pt(112, 58),  # right wing trailing edge
        pt(96, 62),   # right wing inner low
        pt(104, 72),  # right lower wingtip
        pt(84, 72),   # right lower notch
        pt(74, 80),   # right belly
        pt(64, 86),   # belly bottom
        pt(54, 80),   # left belly
        pt(44, 72),   # left lower notch
        pt(24, 72),   # left lower wingtip
        pt(32, 62),   # left wing inner low
        pt(16, 58),   # left wing trailing edge
        pt(28, 30),   # left wing outer tip (high)
        pt(48, 38),   # left ear outer base
        pt(52, 28),   # left ear tip
        pt(56, 38),   # left ear inner base
    ]

    d.polygon(bat, fill='#1a1a1a')

    return img

out_dir = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons')
os.makedirs(out_dir, exist_ok=True)

for size in [16, 48, 128]:
    img = draw_icon(size)
    path = os.path.join(out_dir, f'icon{size}.png')
    img.save(path)
    print(f'Generated {path}')
