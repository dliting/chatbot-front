@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%") do set "SCRIPT_DIR=%%~fi"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."
for %%i in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fi"
set "CHATAPP_DIR=%PROJECT_ROOT%\examples\chatapp\frontend"

set "MODE=mock"

if "%1"=="real" set "MODE=real"
if "%1"=="mock" set "MODE=mock"

if "%MODE%"=="real" (
    set "API_URL=http://localhost:3000"
) else (
    set "API_URL=http://localhost:3001"
)

echo [ChatApp] Starting with %MODE% mode...

for %%p in (5173 5174 5175 5176 5177 5178 5179 5180) do (
    netstat -ano ^| findstr ":%%p " >nul 2^>^&1
    if !errorlevel! equ 0 (
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do (
            taskkill //F //PID %%i >nul 2^>^&1
        )
    )
)

ping -n 2 127.0.0.1 >nul

echo [ChatApp] Running npm in: %CHATAPP_DIR%
cmd /k "cd /d "%CHATAPP_DIR%" && set VITE_API_BASE_URL=%API_URL% && npm run dev"

endlocal
