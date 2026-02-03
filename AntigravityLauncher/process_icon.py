#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

# 路径
src = "/Users/tune/Documents/GitHub/antigravity-auto-accept/AntigravityLauncher/Gemini_Generated_Image_2nj0mz2nj0mz2nj0.png"
dst_dir = "/Users/tune/Documents/GitHub/antigravity-auto-accept/AntigravityLauncher"

# 打开图片
img = Image.open(src).convert("RGBA")
size = img.size[0]

# macOS 图标圆角比例约为 22.37%
corner_radius = int(size * 0.2237)

# 创建圆角蒙版
mask = Image.new("L", (size, size), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (size, size)], radius=corner_radius, fill=255)

# 应用蒙版
result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
result.paste(img, (0, 0), mask)

# 保存圆角版本
rounded_path = os.path.join(dst_dir, "icon_rounded.png")
result.save(rounded_path, "PNG")
print(f"✅ 圆角图标已保存: icon_rounded.png ({size}x{size})")

# 生成各种尺寸用于 .icns
sizes = [16, 32, 64, 128, 256, 512, 1024]
iconset_dir = os.path.join(dst_dir, "AppIcon.iconset")
os.makedirs(iconset_dir, exist_ok=True)

for s in sizes:
    resized = result.resize((s, s), Image.LANCZOS)
    resized.save(os.path.join(iconset_dir, f"icon_{s}x{s}.png"))
    # @2x 版本
    if s <= 512:
        resized_2x = result.resize((s*2, s*2), Image.LANCZOS)
        resized_2x.save(os.path.join(iconset_dir, f"icon_{s}x{s}@2x.png"))

print(f"✅ iconset 已生成: AppIcon.iconset/")
