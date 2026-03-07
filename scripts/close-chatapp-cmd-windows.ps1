# Close all ChatApp cmd windows
$ErrorActionPreference = 'SilentlyContinue'

$chatAppCmds = Get-CimInstance Win32_Process -Filter 'Name="cmd.exe"' | Where-Object {
    $_.CommandLine -match 'chatapp' -and $_.CommandLine -match 'examples\\chatapp'
}

if ($chatAppCmds) {
    Write-Host "Found $($chatAppCmds.Count) ChatApp command window(s):"
    foreach ($cmd in $chatAppCmds) {
        Write-Host "  Closing: PID $($cmd.ProcessId)"
        Stop-Process -Id $cmd.ProcessId -Force
    }
    Write-Host "All ChatApp command windows closed."
} else {
    Write-Host "No ChatApp command windows found."
}
