@echo off
setlocal enabledelayedexpansion

echo === ChatApp Stopping ===
echo.

set "KILLED=0"

for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 5181 5182 5183 5184 5185) do (
    for /f "tokens=*" %%i in ('powershell.exe -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %%p -ErrorAction Stop ^| Select-Object -ExpandProperty OwningProcess } catch { }"') do (
        set "PID=%%i"
        if defined PID (
            for /f "tokens=*" %%j in ("!PID!") do (
                if not "%%j"=="" (
                    if not "%%j"=="OwningProcess" (
                        echo Stopping port %%p, PID: %%j
                        taskkill /F /PID %%j >nul 2>&1
                        set "KILLED=1"
                    )
                )
            )
        )
    )
)

if "%KILLED%"=="1" (
    echo.
    echo === ChatApp Stopped ===
) else (
    echo No running servers found.
)

echo.
endlocal
