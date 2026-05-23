from PIL import Image
import numpy as np

img_path = "/Users/alvesoscar517gmail.com/.gemini/antigravity-ide/brain/df070fab-fee3-47ad-ad94-68e4773fe6c7/openvideo_app_icon_1779516547845.png"
out_path = "icon_transparent.png"

img = Image.open(img_path).convert("RGBA")
arr = np.array(img)

# Flood fill from corner
from skimage.segmentation import flood_fill
try:
    # Use skimage if available
    mask = flood_fill(arr[:,:,0], (0, 0), 255, tolerance=10) == 255
    arr[mask, 3] = 0
except ImportError:
    # Manual thresholding (since background is white)
    white_pixels = (arr[:,:,0] > 240) & (arr[:,:,1] > 240) & (arr[:,:,2] > 240)
    arr[white_pixels, 3] = 0

out_img = Image.fromarray(arr)
out_img.save(out_path)
print("Saved to", out_path)
