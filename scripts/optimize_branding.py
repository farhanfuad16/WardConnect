from PIL import Image
from pathlib import Path

root = Path('/home/ubuntu/ward-connect/assets/images')
source = root / 'icon.png'
image = Image.open(source).convert('RGB')
image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
for name in ['icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png']:
    image.save(root / name, format='PNG', optimize=True)
