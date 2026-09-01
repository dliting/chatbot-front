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
  "$projectRoot = '%PROJECT_ROOT%'; " ^
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
  "$chatAppPaths = @(); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\backend-mock')); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\backend-real')); " ^
  "$chatAppPaths += [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'examples\chatapp\frontend')); " ^
  "$killed = 0; " ^
  "$backendPorts = @($realPort, $mockPort) | Select-Object -Unique; " ^
  "$frontendPorts = 5173..5185; " ^
  "$allPorts = $backendPorts + $frontendPorts; " ^
  "$pidsToKill = @(); " ^
  "foreach ($port in $allPorts) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    foreach ($conn in $conns) { " ^
  "      $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; " ^
  "      if ($proc) { " ^
  "        $isChatApp = $false; " ^
  "        $procPath = [System.IO.Path]::GetFullPath($proc.Path); " ^
  "        foreach ($chatAppPath in $chatAppPaths) { " ^
  "          if ($procPath.StartsWith($chatAppPath, 'OrdinalIgnoreCase')) { " ^
  "            $isChatApp = $true; " ^
  "            break; " ^
  "          } " ^
  "        } " ^
  "        if (-not $isChatApp -and $procPath -match 'node\.exe$') { " ^
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
  "          $portType = if ($backendPorts -contains $port) { 'backend' } else { 'frontend' }; " ^
  "          Write-Host \"Stopping $portType on port $port (PID: $($conn.OwningProcess), Process: $($proc.ProcessName))\"; " ^
  "          $pidsToKill += $conn.OwningProcess; " ^
  "          $killed = 1; " ^
  "        } else { " ^
  "          Write-Host \"Skipping non-ChatApp process on port $port ($($proc.ProcessName) PID: $($conn.OwningProcess))\"; " ^
  "        } " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "} " ^
  "if ($pidsToKill.Count -gt 0) { " ^
  "  $pidsToKill = $pidsToKill | Select-Object -Unique; " ^
  "  foreach ($pid in $pidsToKill) { " ^
  "    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; " ^
  "  } " ^
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
