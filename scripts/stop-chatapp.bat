@echo off
setlocal enabledelayedexpansion

echo === ChatApp Stopping ===
echo.

set "KILLED=0"

rem 使用netstat查找占用端口的进程
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 5181 5182 5183 5184 5185) do (
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr /c:":%%p " ^| findstr /c:"LISTENING" 2^>nul') do (
        if not "%%i"=="" (
            if not "%%i"=="0" (
                rem 验证PID是否存在并且是node进程
                tasklist /FI "PID eq %%i" 2>nul | find /i "node.exe" >nul
                if !errorlevel! equ 0 (
                    echo Stopping ChatApp server on port %%p (PID: %%i)
                    taskkill /F /PID %%i >nul 2>&1
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
