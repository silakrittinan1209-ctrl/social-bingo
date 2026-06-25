# แสดง URL ปัจจุบันของระบบ Social Bingo
Write-Host ""
Write-Host "=== Social Bingo URLs ===" -ForegroundColor Cyan

# ดึง URL จาก ngrok API
$url = $null
try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
    $url = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
} catch {
    # ngrok ยังไม่พร้อม
}

if ($url) {
    Write-Host "Public URL : $url" -ForegroundColor Green
    Write-Host ""
    Write-Host "Register   : $url/register" -ForegroundColor Yellow
    Write-Host "Game       : $url/game" -ForegroundColor Yellow
    Write-Host "Admin      : $url/admin" -ForegroundColor Yellow
    Write-Host "QR Code    : $url/qr" -ForegroundColor Yellow
    Write-Host "Leaderboard: $url/leaderboard" -ForegroundColor Yellow
} else {
    Write-Host "Local URL  : http://localhost:3000" -ForegroundColor Yellow
    Write-Host "(ngrok กำลังเริ่ม หรือยังไม่พร้อม)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
pm2 list
