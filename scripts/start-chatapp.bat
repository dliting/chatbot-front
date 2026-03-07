@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%") do set "SCRIPT_DIR=%%~fi"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."
for %%i in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fi"
set "CONFIG_DIR=%PROJECT_ROOT%\examples\chatapp"
set "CHATAPP_DIR=%CONFIG_DIR%\frontend"

set "MODE=mock"

if "%1"=="real" set "MODE=real"
if "%1"=="mock" set "MODE=mock"

rem Load config from file
set "CONFIG_FILE=%CONFIG_DIR%\%MODE%.env"
if not exist "%CONFIG_FILE%" (
    echo Error: Config file %CONFIG_FILE% not found
    exit /b 1
)

rem Parse config file - only PORT is needed
for /f "tokens=1,* delims==" %%a in ('findstr /i "^PORT" "%CONFIG_FILE%"') do (
    set "%%a=%%b"
)

rem Derive other values from PORT and MODE
set "BACKEND_PORT=%PORT%"
if "%MODE%"=="real" (
    set "BACKEND_DIR=backend-real"
) else (
    set "BACKEND_DIR=backend-mock"
)
set "API_URL=http://localhost:%PORT%"
set "VITE_API_BASE_URL=%API_URL%"

set "BACKEND_DIR_FULL=%CONFIG_DIR%\%BACKEND_DIR%"

echo === ChatApp Starting ===
echo Mode: %MODE%
echo Config: %CONFIG_FILE%
echo API:  %API_URL%
echo.

rem Check and kill ports
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 %BACKEND_PORT%) do (
    netstat -ano ^| findstr ":%%p " >nul 2^>^&1
    if !errorlevel! equ 0 (
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do (
            taskkill //F //PID %%i >nul 2^>nul
        )
    )
)

ping -n 2 127.0.0.1 >nul

rem Check backend dependencies
if not exist "%BACKEND_DIR_FULL%\node_modules" (
    echo Installing backend dependencies...
    cd /d "%BACKEND_DIR_FULL%"
    call npm install
)

rem Start backend with PORT environment variable
echo Starting backend server...
start "ChatApp Backend (%MODE%)" cmd /k "cd /d "%BACKEND_DIR_FULL%" && set PORT=%BACKEND_PORT% && echo Backend running on port %BACKEND_PORT% && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

rem Wait for backend
ping -n 3 127.0.0.1 >nul

rem Create frontend .env file (use API_URL from config)
(
    echo # Frontend Configuration
    echo VITE_API_BASE_URL=%API_URL%
) > "%CHATAPP_DIR%\.env"

rem Start frontend
echo Starting frontend...
start "ChatApp Frontend" cmd /k "cd /d "%CHATAPP_DIR%" && echo Frontend running on http://localhost:5180 && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

echo.
echo === ChatApp Started ===
echo Mode: %MODE%
echo Backend: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:5180
echo.
if "%MODE%"=="real" echo If using Real mode, make sure Ollama is running: ollama serve
echo.
endlocal
