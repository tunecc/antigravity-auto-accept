#!/bin/bash
# Antigravity Auto-Retry 启动脚本 (macOS)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_PORT="${1:-9222}"

echo "🚀 启动 Antigravity Auto-Retry..."
echo "   CDP 端口: $CDP_PORT"
echo ""

# 检查 Antigravity 是否在运行
if ! curl -s "http://localhost:$CDP_PORT/json" > /dev/null 2>&1; then
    echo "⚠️  警告: 无法连接到 Antigravity (端口 $CDP_PORT)"
    echo "   请确保 Antigravity 使用以下命令启动:"
    echo ""
    echo "   /Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=$CDP_PORT"
    echo ""
    read -p "是否仍要启动应用? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

CDP_PORT=$CDP_PORT node "$SCRIPT_DIR/index.js"
