from PIL import Image, ImageChops
import os

def trim(im):
    # Convert to RGBA just in case
    im = im.convert("RGBA")
    # Get the alpha channel
    alpha = im.split()[-1]
    # Create a mask where alpha > 10
    mask = alpha.point(lambda p: 255 if p > 10 else 0)
    # Get bounding box of the mask
    bbox = mask.getbbox()
    if bbox:
        # Add a bit of padding
        pad = 20
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(im.width, bbox[2] + pad)
        y1 = min(im.height, bbox[3] + pad)
        return im.crop((x0, y0, x1, y1))
    return None

images_to_trim = ['AppleSlices.png', 'PearSlices.png', 'PineappleSlices.png', 'BananaChips.png', 'MangoStrips.png']
# Actually let's just do all
for name in images_to_trim:
    path = os.path.join('public/images', name)
    try:
        img = Image.open(path)
        trimmed = trim(img)
        if trimmed:
            trimmed.save(path)
            print(f"Trimmed {name} from {img.size} to {trimmed.size}")
        else:
            print(f"Could not trim {name}")
    except Exception as e:
        print(f"Failed processing {name}: {e}")
