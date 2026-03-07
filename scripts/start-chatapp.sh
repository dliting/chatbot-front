#!/bin/bash
# ChatApp 启动脚本
# 用法: ./start-chatapp.sh [mock|real]
#   mock - 使用Mock后端 (默认)
#   real - 使用Real后端 (Ollama)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录 (scripts的父目录)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHATAPP_DIR="$PROJECT_ROOT/examples/chatapp/frontend"

# 默认值
MODE="mock"

# 解析参数
if [ "$1" = "real" ]; then
    MODE="real"
elif [ "$1" = "mock" ]; then
    MODE="mock"
elif [ -n "$1" ]; then
    echo -e "${RED}错误: 未知参数 '$1'${NC}"
    echo "用法: ./start-chatapp.sh [mock|real]"
    echo ""
    echo "参数说明:"
    echo "  mock  使用Mock后端 (默认) - http://localhost:3001"
    echo "  real  使用Real后端 (Ollama) - http://localhost:3000"
    exit 1
fi

# 设置API URL
if [ "$MODE" = "real" ]; then
    API_URL="http://localhost:3000"
    MODE_DESC="Real (Ollama)"
else
    API_URL="http://localhost:3001"
    MODE_DESC="Mock"
fi

echo -e "${GREEN}=== ChatApp 启动脚本 ===${NC}"
echo -e "后端模式: ${YELLOW}$MODE_DESC${NC}"
echo -e "API URL:  ${API_URL}"
echo ""

# 检查端口占用
check_port() {
    local port=$1
    if netstat -ano 2>/dev/null | grep -q ":$port "; then
        return 0  # 端口被占用
    fi
    return 1  # 端口空闲
}

# 查找并终止占用端口的进程
kill_port() {
    local port=$1
    local pids=$(netstat -ano 2>/dev/null | grep ":$port " | awk '{print $5}' | sort -u)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}端口 $port 已被占用，尝试终止进程...${NC}"
        for pid in $pids; do
            if [ -n "$pid" ] && [ "$pid" != "0" ]; then
                taskkill //F //PID "$pid" 2>/dev/null || true
            fi
        done
        sleep 1
    fi
}

# 检查并终止5173-5180端口的现有进程
for port in 5173 5174 5175 5176 5177 5178 5179 5180; do
    if check_port $port; then
        kill_port $port
    fi
done

# 配置环境变量
export VITE_API_BASE_URL="$API_URL"

# 启动开发服务器
echo -e "${GREEN}启动 ChatApp 开发服务器...${NC}"
cd "$CHATAPP_DIR"

# 后台启动
npm run dev &
DEV_PID=$!

# 等待服务器启动
echo -e "${YELLOW}等待服务器启动...${NC}"
sleep 3

# 查找实际端口
FOUND_PORT=""
for i in {1..10}; do
    for port in 5173 5174 5175 5176 5177 5178 5179 5180 5181 5182; do
        if netstat -ano 2>/dev/null | grep -q ":$port "; then
            # 检查是否是vite服务器
            curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/" | grep -q "200" && {
                FOUND_PORT=$port
                break 2
            }
        fi
    done
    sleep 1
done

if [ -n "$FOUND_PORT" ]; then
    echo ""
    echo -e "${GREEN}=== ChatApp 启动成功! ===${NC}"
    echo -e "访问地址: ${YELLOW}http://localhost:$FOUND_PORT/${NC}"
    echo ""
    echo -e "${GREEN}可选模式:${NC}"
    echo "  • http://localhost:$FOUND_PORT/         - 首页"
    echo "  • http://localhost:$FOUND_PORT/extended - 扩展模式 (双栏布局)"
    echo "  • http://localhost:$FOUND_PORT/sidebar  - 边栏模式 (单栏布局)"
    echo "  • http://localhost:$FOUND_PORT/floating - 悬浮模式 (单栏布局)"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"

    # 保存PID到文件
    echo $! > "$SCRIPT_DIR/chatapp.pid"

    # 等待用户中断
    wait
else
    echo -e "${RED}启动失败: 无法找到运行中的服务器${NC}"
    exit 1
fi
