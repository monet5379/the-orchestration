# The Orchestration — prototype launcher
# Python은 별도 숨김 프로세스로 띄워 콘솔을 붙잡지 않음.
# Ctrl+C / 창 종료 / 아무 키 모두 finally에서 서버를 정리함.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 8080
$Url = "http://127.0.0.1:$Port/"
Set-Location $Root

function Stop-PortListeners {
  param([int]$Port)
  try {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      }
  } catch {}

  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and (
        ($_.CommandLine -like '*serve.py*' -and $_.CommandLine -like "*$Port*") -or
        ($_.CommandLine -like '*npx*' -and $_.CommandLine -like '*serve*' -and $_.CommandLine -like "*$Port*")
      )
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Write-Host ' The Orchestration — Prototype'
Write-Host ' ============================='
Write-Host " Folder: $Root"
Write-Host " URL:    $Url"
Write-Host ''

Stop-PortListeners -Port $Port

$python = Get-Command python -ErrorAction SilentlyContinue
$node = Get-Command node -ErrorAction SilentlyContinue
$server = $null

if ($python) {
  Write-Host ' Using: Python serve.py (no-cache for js/css/html)'
  Write-Host ' Starting server...'
  $server = Start-Process -FilePath $python.Source `
    -ArgumentList @('-u', 'serve.py', '--port', "$Port") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -PassThru
} elseif ($node) {
  Write-Host ' Using: npx serve'
  Write-Host ' Starting server...'
  $server = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList @('/c', "npx --yes serve . -l $Port") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -PassThru
} else {
  Write-Host ' ERROR: Python or Node.js is required.'
  Write-Host ''
  Write-Host ' Install one of:'
  Write-Host '   - Python  https://www.python.org/downloads/'
  Write-Host '   - Node.js https://nodejs.org/'
  Write-Host ''
  Read-Host 'Press Enter to close'
  exit 1
}

Start-Sleep -Seconds 2
Start-Process $Url

Write-Host " Server: $Url"
Write-Host ''
Write-Host ' Press Ctrl+C  or  any key  to STOP and close.'
Write-Host ''

try {
  while ($true) {
    if ($server -and $server.HasExited) {
      Write-Host ' Server process exited unexpectedly.'
      break
    }
    if ([Console]::KeyAvailable) {
      [void][Console]::ReadKey($true)
      break
    }
    Start-Sleep -Milliseconds 200
  }
} finally {
  Write-Host ''
  Write-Host ' Stopping...'
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  Stop-PortListeners -Port $Port
  Write-Host ' Done.'
  Start-Sleep -Milliseconds 400
}
