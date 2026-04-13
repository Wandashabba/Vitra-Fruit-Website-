import sys
from PIL import Image

def analyze(img_path):
    img = Image.open(img_path)
    bbox = img.getbbox()
    w, h = img.size
    print(f"Image: {img_path}")
    print(f"Size: {w}x{h}")
    print(f"Trimmed bounding box: {bbox}")
    if bbox:
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        print(f"Trimmed size: {tw}x{th}")
        print(f"Ratio of trimmed width to total width: {tw/w:.2f}")

analyze("public/images/GrapefruitFront.png")
analyze("public/images/LimeSlices1.png")
