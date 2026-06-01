@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%") do set "SCRIPT_DIR=%%~fi"
set "PROJECT_ROOT=%SCRIPT_DIR%\.."
for %%i in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fi"
set "CONFIG_DIR=%PROJECT_ROOT%\examples\chatapp"
set "CHATAPP_DIR=%CONFIG_DIR%\frontend"

set "MOCK_CONFIG=%CONFIG_DIR%\mock.env"
set "REAL_CONFIG=%CONFIG_DIR%\real.env"

if not exist "%MOCK_CONFIG%" (
    echo Error: Mock config file not found: %MOCK_CONFIG%
    exit /b 1
)
if not exist "%REAL_CONFIG%" (
    echo Error: Real config file not found: %REAL_CONFIG%
    exit /b 1
)

rem Parse mock config
set "MOCK_PORT=3001"
for /f "tokens=1,* delims==" %%a in ('findstr /i "^PORT" "%MOCK_CONFIG%"') do (
    set "MOCK_PORT=%%b"
)

rem Parse real config
set "REAL_PORT=3000"
for /f "tokens=1,* delims==" %%a in ('findstr /i "^PORT" "%REAL_CONFIG%"') do (
    set "REAL_PORT=%%b"
)

set "MOCK_DIR=%CONFIG_DIR%\backend-mock"
set "REAL_DIR=%CONFIG_DIR%\backend-real"

echo === ChatApp Starting ===
echo Mock backend: http://localhost:%MOCK_PORT%
echo Real backend: http://localhost:%REAL_PORT%
echo Frontend:     http://localhost:5180
echo.

rem Check and kill occupied ports using PowerShell for reliability
echo Checking ports...
powershell -NoProfile -Command ^
  "$ErrorActionPreference = 'SilentlyContinue'; " ^
  "$projectRoot = '%PROJECT_ROOT%'; " ^
  "$chatAppPaths = @(); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\backend-mock')); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\backend-real')); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\frontend')); " ^
  "$ports = @('%MOCK_PORT%', '%REAL_PORT%', 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180); " ^
  "foreach ($port in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    foreach ($conn in $conns) { " ^
  "      $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; " ^
  "      if ($proc) { " ^
  "        $procPath = [System.IO.Path]::GetFullPath($proc.Path); " ^
  "        $isChatApp = $false; " ^
  "        foreach ($chatAppPath in $chatAppPaths) { " ^
  "          if ($procPath.StartsWith($chatAppPath, 'OrdinalIgnoreCase')) { " ^
  "            $isChatApp = $true; " ^
  "            break; " ^
  "          } " ^
  "        } " ^
  "        if ($procPath -match 'node\.exe$') { " ^
  "          try { " ^
  "            $parentProc = Get-Process -Id $proc.ParentProcessId -ErrorAction SilentlyContinue; " ^
  "            if ($parentProc -and ($parentProc.ProcessName -eq 'cmd' -or $parentProc.ProcessName -eq 'npm')) { " ^
  "              $parentCmd = if ($parentProc.CommandLine) { $parentProc.CommandLine } else { '' }; " ^
  "              if ($parentCmd -match 'examples[\\\\/]chatapp') { " ^
  "                $isChatApp = $true; " ^
  "              } " ^
  "            } " ^
  "          } catch { } " ^
  "        } " ^
  "        if ($isChatApp) { " ^
  "          Write-Host \"Stopping ChatApp process on port $port (PID: $($conn.OwningProcess), $($proc.ProcessName))\"; " ^
  "          Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue; " ^
  "        } else { " ^
  "          Write-Host \"WARNING: Port $port occupied by non-ChatApp process ($($proc.ProcessName) PID $($conn.OwningProcess)) - skipping\"; " ^
  "        } " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "}"
ping -n 2 127.0.0.1 >nul

rem Check and install mock backend dependencies
if not exist "%MOCK_DIR%\node_modules" (
    echo Installing mock backend dependencies...
    cd /d "%MOCK_DIR%"
    call npm install
)

rem Check and install real backend dependencies
if not exist "%REAL_DIR%\node_modules" (
    echo Installing real backend dependencies...
    cd /d "%REAL_DIR%"
    call npm install
)

rem Start mock backend
echo Starting mock backend (port %MOCK_PORT%)...
start "ChatApp-Backend-Mock" cmd /k "cd /d "%MOCK_DIR%" && set PORT=%MOCK_PORT% && echo Mock backend running on port %MOCK_PORT% && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

rem Start real backend
echo Starting real backend (port %REAL_PORT%)...
start "ChatApp-Backend-Real" cmd /k "cd /d "%REAL_DIR%" && set PORT=%REAL_PORT% && echo Real backend running on port %REAL_PORT% && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

rem Wait for backends
ping -n 3 127.0.0.1 >nul

rem Create frontend .env (no longer needs VITE_API_BASE_URL — proxy is in vite.config.ts)
(
    echo # Frontend Configuration
    echo # API proxy configured in vite.config.ts:
    echo #   /api/mock -^> http://localhost:%MOCK_PORT%
    echo #   /api/real -^> http://localhost:%REAL_PORT%
) > "%CHATAPP_DIR%\.env"

rem Start frontend
echo Starting frontend...
start "ChatApp Frontend" cmd /k "cd /d "%CHATAPP_DIR%" && echo Frontend running on http://localhost:5180 && echo. && echo Press Ctrl+C to stop. && echo. && npm run dev"

echo.
echo === ChatApp Started ===
echo Mock backend: http://localhost:%MOCK_PORT%
echo Real backend: http://localhost:%REAL_PORT%
echo Frontend:     http://localhost:5180
echo.
echo Tip: Use the Settings page (gear icon) to switch between Mock and Real backends.
echo If using Real mode, make sure Ollama is running: ollama serve
echo.
endlocal
