"""Prepare the client's project photos for the website.

Usage: python3 scripts/process-photos.py <folder-with-original-photos>

For every photo listed in PHOTOS this script:
  * applies EXIF rotation,
  * crops the phone watermark strip ("Galaxy S22 Ultra") from Samsung exports,
  * gives a light, natural lift (contrast, colour, sharpness),
  * aligns before/after pairs that are shown with the draggable slider,
  * saves the result to assets/source/<name>.jpg (long edge ≤ 2400px).
Then run `npm run images` to build the responsive versions.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

SRC = Path(sys.argv[1])
OUT = Path("assets/source")
MAX_EDGE = 2400

# name -> original file
PHOTOS = {
    # Decorative finishes
    "marble-feature-wall": "20260812_141833.jpg",
    "marble-feature-wall-wide": "20260812_141644.jpg",
    "marble-swirl-detail": "20260226_081902.jpg",
    "marble-swirl-detail-2": "20260630_121755.jpg",
    "rock-texture-detail": "20260630_121136.jpg",
    "rock-texture-detail-2": "20260630_121149.jpg",
    "concrete-effect-detail": "20260630_121453.jpg",
    "polished-plaster-detail": "20260630_121708.jpg",
    "stone-effect-wall-detail": "20260812_122204.jpg",
    # Exteriors
    "house-before": "jerra.jpg",
    "house-after": "jerra1 (1).jpg",
    "brick-home-before": "white house 2.jpg",
    "brick-home-after": "white house.jpg",
    "brick-home-side": "white house 1.jpg",
    "brick-home-front": "white house5.jpg",
    "letterbox-before": "white house 3.jpg",
    "letterbox-after": "white house 4.jpg",
    "weatherboard-before": "yarra.jpg",
    "weatherboard-after": "yarra1.jpg",
    "fascia-before": "giogina.jpg",
    "fascia-after": "giogina2.jpg",
    "stairs-before": "IMG_20220412_161423.jpg",
    "stairs-after": "IMG_20220503_121703.jpg",
    # Timber
    "deck-before": "deck.jpg",
    "deck-after": "deck1.jpg",
    "path-before": "IMG_20220323_085157.jpg",
    "path-after": "IMG_20220324_153309.jpg",
    "table-before": "table1.jpg",
    "table-after": "table2.jpg",
    # Floors
    "patio-floor-before": "IMG_20220214_144155.jpg",
    "patio-floor-after": "IMG_20220215_174933.jpg",
    "plant-room-floor-before": "plantRM.jpg",
    "plant-room-floor-after": "plantRM1.jpg",
    "epoxy-floor": "IMG20180409090426.jpg",
    # Interiors
    "bedroom-before": "ani.jpg",
    "bedroom-after": "ani1.jpg",
    "vanity-before": "vanity.jpg",
    "vanity-after": "vanity1.jpg",
    "living-green": "jerra1.jpg",
    "living-green-2": "jerra2.jpg",
    "living-green-3": "jerra3.jpg",
    "living-neutral": "margret1.jpg",
    "dining-neutral": "margret2.jpg",
    "bedroom-neutral": "margret3.jpg",
    "study-neutral": "margret4.jpg",
    "bedroom-neutral-2": "margret5.jpg",
    "stairwell": "rashmi1.jpg",
    "stairwell-2": "rashmi7 (1).jpg",
    "stairwell-3": "rasmi1.jpg",
}

# Pairs shown with the draggable slider: the "before" is warped onto the "after".
ALIGN = [
    ("deck-before", "deck-after"),
    ("path-before", "path-after"),
    ("patio-floor-before", "patio-floor-after"),
    ("plant-room-floor-before", "plant-room-floor-after"),
    ("vanity-before", "vanity-after"),
    ("weatherboard-before", "weatherboard-after"),
]

WATERMARKED_SIZES = {(656, 1164), (2068, 1164), (1164, 656)}


def load(name):
    im = ImageOps.exif_transpose(Image.open(SRC / PHOTOS[name])).convert("RGB")
    if im.size in WATERMARKED_SIZES:
        w, h = im.size
        keep = 0.88 if w > h else 0.93  # the watermark sits higher on landscape exports
        im = im.crop((0, 0, w, int(h * keep)))
    return im


def enhance(im):
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.08)
    im = ImageEnhance.Sharpness(im).enhance(1.2)
    return im


def fit(im):
    w, h = im.size
    s = min(1.0, MAX_EDGE / max(w, h))
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im


def inner_rect(mask):
    """Largest axis-aligned box (approximately) fully inside a binary mask."""
    h, w = mask.shape
    x0, y0, x1, y1 = 0, 0, w - 1, h - 1
    while x1 - x0 > w * 0.3 and y1 - y0 > h * 0.3:
        bad = [k for k, edge in (
            ("t", mask[y0, x0:x1 + 1]), ("b", mask[y1, x0:x1 + 1]),
            ("l", mask[y0:y1 + 1, x0]), ("r", mask[y0:y1 + 1, x1]),
        ) if edge.min() == 0]
        if not bad:
            return x0, y0, x1, y1
        x0 += 2 * ("l" in bad); x1 -= 2 * ("r" in bad)
        y0 += 2 * ("t" in bad); y1 -= 2 * ("b" in bad)
    return None


def align(before, after):
    """Warp `before` onto `after` (similarity transform). Returns None if the fit is poor."""
    w, h = after.size
    rgb_b = np.array(before.resize(after.size, Image.LANCZOS))
    a = cv2.cvtColor(np.array(after), cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(rgb_b, cv2.COLOR_RGB2GRAY)
    sift = cv2.SIFT_create(8000)
    kb, db = sift.detectAndCompute(b, None)
    ka, da = sift.detectAndCompute(a, None)
    good = [m for m, n in cv2.BFMatcher().knnMatch(db, da, k=2) if m.distance < 0.72 * n.distance]
    if len(good) < 25:
        print(f"  only {len(good)} matches - left unaligned")
        return None
    src = np.float32([kb[m.queryIdx].pt for m in good])
    dst = np.float32([ka[m.trainIdx].pt for m in good])
    M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4.0)
    if M is None or inliers.sum() < 20:
        print("  no stable transform - left unaligned")
        return None
    warped = cv2.warpAffine(rgb_b, M, (w, h), flags=cv2.INTER_LANCZOS4)
    mask = cv2.erode(cv2.warpAffine(np.full((h, w), 255, np.uint8), M, (w, h)), np.ones((5, 5), np.uint8))
    scale = (M[0, 0] ** 2 + M[1, 0] ** 2) ** 0.5
    if not 0.8 < scale < 1.25:
        print(f"  implausible scale {scale:.3f} - left unaligned")
        return None
    box = inner_rect(mask)
    if box is None or (box[2] - box[0]) * (box[3] - box[1]) < 0.6 * w * h:
        print("  overlap too small - left unaligned")
        return None
    print(f"  {int(inliers.sum())} inliers, scale {scale:.3f}, keeping {(box[2] - box[0]) / w:.0%} x {(box[3] - box[1]) / h:.0%}")
    return Image.fromarray(warped).crop(box), after.crop(box)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    images = {name: load(name) for name in PHOTOS}
    for before, after in ALIGN:
        print(f"{before} -> {after}")
        result = align(images[before], images[after])
        if result:
            images[before], images[after] = result
    for name, im in images.items():
        fit(enhance(im)).save(OUT / f"{name}.jpg", quality=92, optimize=True)
    print(f"{len(images)} photos written to {OUT}")


if __name__ == "__main__":
    main()
