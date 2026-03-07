@echo off
setlocal enabledelayedexpansion

echo === ChatApp Stopping ===
echo.

set "KILLED=0"

rem 使用PowerShell查找并停止Vite服务器
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 5181 5182 5183 5184 5185) do (
    for /f %%i in ('powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; try { $conn = Get-NetTCPConnection -LocalPort %%p -State Listen -ErrorAction SilentlyContinue; if ($conn) { $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; if ($proc -and $proc.ProcessName -eq 'node') { $conn.OwningProcess } } } catch {}" 2^>nul') do (
        if not "%%i"=="" (
            echo Stopping ChatApp server on port %%p (PID: %%i)
            taskkill /F /PID %%i >nul 2>&1
            set "KILLED=1"
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
