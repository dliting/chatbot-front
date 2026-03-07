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
    set "MODE_DESC=Real (Ollama)"
) else (
    set "API_URL=http://localhost:3001"
    set "MODE_DESC=Mock"
)

echo === ChatApp Starting ===
echo Mode: %MODE_DESC%
echo API:  %API_URL%
echo.

rem 检查并终止端口占用
for %%p in (5173 5174 5175 5176 5177 5178 5179 5180) do (
    netstat -ano ^| findstr ":%%p " >nul 2^>^&1
    if !errorlevel! equ 0 (
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do (
            taskkill //F //PID %%i >nul 2^>^&1
        )
    )
)

ping -n 2 127.0.0.1 >nul

rem 在新窗口中启动服务（保持当前窗口目录不变）
echo Starting server in new window...
start "ChatApp Server" cmd /k "cd /d "%CHATAPP_DIR%" && set VITE_API_BASE_URL=%API_URL% && echo ChatApp running in: %%CD%% && echo. && echo Press Ctrl+C to stop the server. && echo. && npm run dev"

echo.
echo === ChatApp Starting ===
echo Server is starting in a new window.
echo You can close this window and return to your work.
echo.
endlocal
