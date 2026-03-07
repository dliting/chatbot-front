#!/bin/bash
# ChatApp 停止脚本
# 用法: ./stop-chatapp.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 保存原始工作目录
ORIGINAL_DIR="$(pwd)"

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 退出时恢复原始工作目录
trap 'cd "$ORIGINAL_DIR"' EXIT

echo -e "${GREEN}=== ChatApp 停止脚本 ===${NC}"
echo ""

# 查找并终止vite开发服务器进程
KILLED=0

# 方法1: 查找PID文件
if [ -f "$SCRIPT_DIR/chatapp.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/chatapp.pid")
    if [ -n "$PID" ] && tasklist //FI "PID eq $PID" 2>/dev/null | grep -q "node"; then
        echo -e "终止进程 PID: $PID"
        taskkill //F //PID "$PID" 2>/dev/null || true
        KILLED=1
    fi
    rm -f "$SCRIPT_DIR/chatapp.pid"
fi

# 方法2: 查找端口5173-5185上的Node进程
echo -e "${YELLOW}查找并终止占用端口的进程...${NC}"

for port in 5173 5174 5175 5176 5177 5178 5179 5180 5181 5182 5183 5184 5185; do
    if netstat -ano 2>/dev/null | grep -q ":$port "; then
        PIDS=$(netstat -ano 2>/dev/null | grep ":$port " | awk '{print $5}' | sort -u)

        for pid in $PIDS; do
            if [ -n "$pid" ] && [ "$pid" != "0" ]; then
                # 检查是否是Node进程
                if tasklist //FI "PID eq $pid" 2>/dev/null | grep -qi "node"; then
                    echo -e "终止端口 $port 占用进程 PID: $pid"
                    taskkill //F //PID "$pid" 2>/dev/null || true
                    KILLED=1
                fi
            fi
        done
    fi
done

# 方法3: 查找所有vite/node进程
echo -e "${YELLOW}查找所有相关进程...${NC}"
VITE_PIDS=$(tasklist //FI "IMAGENAME eq node.exe" 2>/dev/null | grep -oE "[0-9]+" | head -20)

for pid in $VITE_PIDS; do
    if [ -n "$pid" ]; then
        # 尝试终止
        taskkill //F //PID "$pid" 2>/dev/null || true
    fi
done

if [ $KILLED -eq 1 ]; then
    echo ""
    echo -e "${GREEN}ChatApp 已停止!${NC}"
else
    echo -e "${YELLOW}未发现运行中的 ChatApp${NC}"
fi

# 清理
rm -f "$SCRIPT_DIR/chatapp.pid" 2>/dev/null || true

echo ""
echo -e "${GREEN}Done!${NC}"
