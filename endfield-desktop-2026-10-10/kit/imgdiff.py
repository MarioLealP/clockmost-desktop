# uv run --with pillow python -I kit/imgdiff.py <a.png> <b.png> <diff.png> [x0,y0,x1,y1 ...]
# Compares two same-size screenshots. Rects given are ignored (live parts: visualizer, timer).
# Prints the share of pixels that differ by more than a small threshold, the bounding box of the
# differences, and writes diff.png (differing pixels in red over a dimmed copy of b).
import sys

from PIL import Image, ImageChops

a, b, out, *rects = sys.argv[1:]
A = Image.open(a).convert("RGB")
B = Image.open(b).convert("RGB")
if A.size != B.size:
    sys.exit(f"size mismatch {A.size} vs {B.size}")
mask = ImageChops.difference(A, B).convert("L").point(lambda v: 255 if v > 24 else 0)
for r in rects:
    x0, y0, x1, y1 = map(int, r.split(","))
    mask.paste(0, (x0, y0, x1, y1))
hist = mask.histogram()
n = hist[255]
total = A.size[0] * A.size[1]
print(f"differing pixels: {n} ({100 * n / total:.3f}%)  bbox: {mask.getbbox()}")
red = Image.new("RGB", B.size, (255, 0, 0))
Image.composite(red, Image.blend(B, Image.new("RGB", B.size), 0.6), mask).save(out)
print("wrote", out)
