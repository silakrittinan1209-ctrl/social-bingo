# แสดง URL ปัจจุบันของระบบ Social Bingo
Write-Host ""
Write-Host "=== Social Bingo URLs ===" -ForegroundColor Cyan

# ดึง ngrok URL จาก PM2 log
$url = pm2 logs bingo-tunnel --lines 50 --nostream 2>&1 | Select-String '"url":"' | Select-Object -Last 1
if ($url -match '"url":"(https://[^"]+)"') {
    $ngrokUrl = $Matches[1]
    Write-Host "Public URL : $ngrokUrl" -ForegroundColor Green
    Write-Host "Register   : $ngrokUrl/register" -ForegroundColor Yellow
    Write-Host "Admin      : $ngrokUrl/admin" -ForegroundColor Yellow
    Write-Host "QR Code    : $ngrokUrl/qr" -ForegroundColor Yellow
    Write-Host "Leaderboard: $ngrokUrl/leaderboard" -ForegroundColor Yellow
} else {
    Write-Host "Local URL  : http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
pm2 list
