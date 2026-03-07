@echo off
setlocal enabledelayedexpansion

echo === ChatApp Stopping ===
echo.

set "KILLED=0"

rem 检查每个端口
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 5181 5182 5183 5184 5185) do (
    rem 使用netstat和findstr查找LISTENING状态的端口
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr "LISTENING" ^| findstr ":%%p "') do (
        set "PID=%%a"
        if not "!PID!"=="" (
            if not "!PID!"=="0" (
                rem 验证PID是node进程
                tasklist /FI "PID eq !PID!" 2>nul | findstr /i "node.exe" >nul
                if !errorlevel! equ 0 (
                    echo Stopping ChatApp server on port %%p (PID: !PID!)
                    taskkill /F /PID !PID! >nul 2>&1
                    set "KILLED=1"
                )
            )
        )
    )
)

if "%KILLED%"=="1" (
    echo.
    echo === ChatApp Stopped ===
) else (
    echo No running ChatApp servers found.
    echo.
    echo Note: Only Vite dev servers on ports 5173-5185 are checked.
    echo Other Node.js processes are left untouched.
)

echo.
endlocal
