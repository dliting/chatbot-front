@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\"
set "CONFIG_DIR=%PROJECT_ROOT%examples\chatapp"

echo === ChatApp Stopping ===
echo.

rem Use PowerShell for reliable port checking and process killing
powershell -NoProfile -Command ^
  "$ErrorActionPreference = 'SilentlyContinue'; " ^
  "$configDir = '%CONFIG_DIR%'; " ^
  "$realPort = '3000'; " ^
  "$mockPort = '3001'; " ^
  "if (Test-Path \"$configDir\real.env\") { " ^
  "  $portLine = Select-String -Path \"$configDir\real.env\" -Pattern '^PORT=' -ErrorAction SilentlyContinue; " ^
  "  if ($portLine) { $realPort = ($portLine.Line -split '=')[1].Trim(); } " ^
  "} " ^
  "if (Test-Path \"$configDir\mock.env\") { " ^
  "  $portLine = Select-String -Path \"$configDir\mock.env\" -Pattern '^PORT=' -ErrorAction SilentlyContinue; " ^
  "  if ($portLine) { $mockPort = ($portLine.Line -split '=')[1].Trim(); } " ^
  "} " ^
  "Write-Host \"Backend ports configured: Real=$realPort, Mock=$mockPort\"; " ^
  "$killed = 0; " ^
  "$backendPorts = @($realPort, $mockPort) | Select-Object -Unique; " ^
  "$frontendPorts = 5173..5185; " ^
  "$allPorts = $backendPorts + $frontendPorts; " ^
  "$pidsToKill = @(); " ^
  "foreach ($port in $allPorts) { " ^
  "  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; " ^
  "  if ($conn) { " ^
  "    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; " ^
  "    if ($proc) { " ^
  "      $portType = if ($backendPorts -contains $port) { 'backend' } else { 'frontend' }; " ^
  "      Write-Host \"Stopping $portType on port $port (PID: $($conn.OwningProcess), Process: $($proc.ProcessName))\"; " ^
  "      $pidsToKill += $conn.OwningProcess; " ^
  "      $killed = 1; " ^
  "    } " ^
  "  } " ^
  "} " ^
  "if ($pidsToKill.Count -gt 0) { " ^
  "  Stop-Process -Id $pidsToKill -Force -ErrorAction SilentlyContinue; " ^
  "  Start-Sleep -Milliseconds 500; " ^
  "} " ^
  "Write-Host ''; " ^
  "if ($killed -eq 0) { " ^
  "  Write-Host 'No running ChatApp servers found.'; " ^
  "} else { " ^
  "  Write-Host '=== ChatApp Stopped ==='; " ^
  "}"

rem Close ChatApp command windows
echo.
echo Closing command windows...
powershell -ExecutionPolicy Bypass -NoProfile -File "%SCRIPT_DIR%close-chatapp-cmd-windows.ps1"

echo.
endlocal
