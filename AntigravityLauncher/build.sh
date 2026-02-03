#!/bin/bash

cd "$(dirname "$0")"

APP_NAME="Antigravity Launcher"
BUNDLE_NAME="AntigravityLauncher.app"

echo "🔨 编译中..."

# 编译
swiftc main.swift -o launcher -O 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

# 创建 .app 包
rm -rf "$BUNDLE_NAME"
mkdir -p "$BUNDLE_NAME/Contents/MacOS"
mkdir -p "$BUNDLE_NAME/Contents/Resources"
mv launcher "$BUNDLE_NAME/Contents/MacOS/AntigravityLauncher"

# 复制图标
if [ -f "AppIcon.icns" ]; then
    cp AppIcon.icns "$BUNDLE_NAME/Contents/Resources/AppIcon.icns"
    echo "📦 已添加应用图标"
fi

# Info.plist
cat > "$BUNDLE_NAME/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Antigravity Launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.antigravity.launcher</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleExecutable</key>
    <string>AntigravityLauncher</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

echo "✅ 完成: $BUNDLE_NAME"
echo ""
echo "使用方法:"
echo "  双击 $BUNDLE_NAME 启动 Antigravity"
echo "  或拖到 /Applications 或 Dock"
