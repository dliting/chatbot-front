@echo off

echo [ChatApp] Stopping...

set "KILLED=0"

for %%p in (5173 5174 5175 5176 5177 5178 5179 5180) do (
    for /f "tokens=*" %%i in ('powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort %%p 2>$null | Select-Object -ExpandProperty OwningProcess"') do (
        if not "%%i"=="" (
            echo [ChatApp] Stopping port %%p, PID: %%i
            taskkill /F /PID %%i >nul 2>&1
            set "KILLED=1"
        )
    )
)

if "%KILLED%"=="1" (
    echo [ChatApp] Stopped.
) else (
    echo [ChatApp] No servers found.
)
