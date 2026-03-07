@echo off
setlocal

echo === ChatApp Stopping ===
echo.

powershell -NoProfile -Command "try { $killed = 0; foreach($p in 5173..5185) { $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if($conn) { $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; if($proc -and $proc.ProcessName -eq 'node') { Write-Host \"Stopping ChatApp server on port $p (PID: $($conn.OwningProcess))\"; Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue; $killed = 1 } } }; if($killed -eq 0) { Write-Host 'No running ChatApp servers found.'; Write-Host ''; Write-Host 'Note: Only Vite dev servers on ports 5173-5185 are checked.'; Write-Host 'Other Node.js processes are left untouched.' } else { Write-Host ''; Write-Host '=== ChatApp Stopped ===' } } catch { Write-Host 'Error stopping servers:' $_.Exception.Message }"

echo.
endlocal
