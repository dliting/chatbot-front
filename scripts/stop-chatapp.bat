@echo off
setlocal enabledelayedexpansion

echo === ChatApp Stopping ===
echo.

set "KILLED=0"

rem 直接查找所有node.exe进程并终止
for /f "skip=1 tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" 2^>nul') do (
    if not "%%a"=="" (
        echo Stopping Node process, PID: %%a
        taskkill /F /PID %%a >nul 2>&1
        set "KILLED=1"
    )
)

if "%KILLED%"=="1" (
    echo.
    echo === ChatApp Stopped ===
) else (
    echo No running Node servers found.
)

echo.
endlocal
