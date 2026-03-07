@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%") do set "SCRIPT_DIR=%%~fi"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."
for %%i in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fi"
set "CHATAPP_DIR=%PROJECT_ROOT%\examples\chatapp\frontend"
set "BACKEND_MOCK_DIR=%PROJECT_ROOT%\examples\chatapp\backend-mock"
set "BACKEND_REAL_DIR=%PROJECT_ROOT%\examples\chatapp\backend-real"

set "MODE=mock"

if "%1"=="real" set "MODE=real"
if "%1"=="mock" set "MODE=mock"

if "%MODE%"=="real" (
    set "API_URL=http://localhost:3000"
    set "MODE_DESC=Real (Ollama)"
    set "BACKEND_DIR=%BACKEND_REAL_DIR%"
    set "BACKEND_PORT=3000"
) else (
    set "API_URL=http://localhost:3001"
    set "MODE_DESC=Mock"
    set "BACKEND_DIR=%BACKEND_MOCK_DIR%"
    set "BACKEND_PORT=3001"
)

echo === ChatApp Starting ===
echo Mode: %MODE_DESC%
echo API:  %API_URL%
echo.

rem 检查并终止端口占用
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180 3000 3001) do (
    netstat -ano ^| findstr ":%%p " >nul 2^>^&1
    if !errorlevel! equ 0 (
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do (
            taskkill //F //PID %%i >nul 2^>^&1
        )
    )
)

ping -n 2 127.0.0.1 >nul

rem 检查后端依赖是否安装
if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    cd /d "%BACKEND_DIR%"
    call npm install
)

rem 在新窗口中启动后端服务
echo Starting backend server...
start "ChatApp Backend (%MODE_DESC%)" cmd /k "cd /d "%BACKEND_DIR%" && echo Backend running on port %BACKEND_PORT% && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

rem 等待后端启动
ping -n 3 127.0.0.1 >nul

rem 在新窗口中启动前端服务
echo Starting frontend...
start "ChatApp Frontend" cmd /k "cd /d "%CHATAPP_DIR%" && set VITE_API_BASE_URL=%API_URL% && echo Frontend running on http://localhost:5180 && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

echo.
echo === ChatApp Started ===
echo Mode: %MODE_DESC%
echo Backend: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:5180
echo.
echo If using Real mode, make sure Ollama is running: ollama serve
echo.
endlocal
