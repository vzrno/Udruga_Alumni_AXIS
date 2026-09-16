#!/usr/bin/env python3
"""Pretvori sliku u standard stranice: 1400x933 + 700x467, WebP, omjer 3:2.

    python3 tools/slika.py images/events/moja-slika.jpg

Original se briše nakon uspješne konverzije. Potreban je Pillow:
    pip install pillow
"""
import os
import re
import sys
import unicodedata

from PIL import Image, ImageFilter

W, H = 1400, 933
SMALL = (700, 467)


def slug(name):
    for a, b in {"č": "c", "ć": "c", "ž": "z", "š": "s", "đ": "d"}.items():
        name = name.replace(a, b).replace(a.upper(), b)
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name)).strip("-")


def flatten(img):
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")


def cover(img, w, h):
    ratio = w / h
    if img.width / img.height > ratio:
        nw = round(img.height * ratio)
        left = (img.width - nw) // 2
        img = img.crop((left, 0, left + nw, img.height))
    else:
        nh = round(img.width / ratio)
        top = (img.height - nh) // 2
        img = img.crop((0, top, img.width, top + nh))
    return img.resize((w, h), Image.LANCZOS)


def framed(img, w, h):
    bg = cover(img, w, h).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", bg.size, (30, 26, 25)), 0.25)
    scale = min((w * 0.86) / img.width, (h * 0.86) / img.height)
    fg = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    bg.paste(fg, ((w - fg.width) // 2, (h - fg.height) // 2))
    return bg


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    for path in sys.argv[1:]:
        folder, filename = os.path.split(path)
        stem = slug(os.path.splitext(filename)[0])
        img = flatten(Image.open(path))
        full = framed(img, W, H) if img.width < 900 else cover(img, W, H)
        full.save(os.path.join(folder, f"{stem}.webp"), "WEBP", quality=82, method=6)
        full.resize(SMALL, Image.LANCZOS).save(os.path.join(folder, f"{stem}-700.webp"), "WEBP", quality=80, method=6)
        if not path.endswith(".webp"):
            os.remove(path)
        print(f"{path} -> {folder}/{stem}.webp + {stem}-700.webp")


if __name__ == "__main__":
    main()
