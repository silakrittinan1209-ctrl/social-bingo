$urlFile = "$env:TEMP\bingo-tunnel-url.txt"
Remove-Item $urlFile -Force -ErrorAction SilentlyContinue

$errFile = "$env:TEMP\bingo-tunnel-err.txt"
$proc = Start-Process -FilePath "ssh" `
  -ArgumentList "-o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:3000 nokey@localhost.run" `
  -NoNewWindow -PassThru `
  -RedirectStandardError $errFile

# Wait for URL in stderr output
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $errFile) {
    $txt = Get-Content $errFile -Raw -ErrorAction SilentlyContinue
    if ($txt -match '(https://\S+\.lhr\.life)') {
      $Matches[1] | Out-File -FilePath $urlFile -Encoding UTF8 -NoNewline
      Write-Host "Tunnel URL: $($Matches[1])"
      break
    }
  }
}

$proc.WaitForExit()
