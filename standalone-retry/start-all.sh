#!/bin/bash
# 一键启动 Antigravity + Auto-Retry

CDP_PORT="${1:-9222}"

echo "🚀 正在启动 Antigravity IDE (调试端口: $CDP_PORT)..."

# 启动 Antigravity
nohup /Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=$CDP_PORT > /dev/null 2>&1 &

echo "⏳ 等待 Antigravity 启动..."
sleep 3

# 检查是否启动成功
for i in {1..10}; do
    if curl -s "http://localhost:$CDP_PORT/json" > /dev/null 2>&1; then
        echo "✅ Antigravity 已启动"
        break
    fi
    sleep 1
done

echo ""
echo "🔄 启动 Auto-Retry 服务..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_PORT=$CDP_PORT node "$SCRIPT_DIR/index.js"
