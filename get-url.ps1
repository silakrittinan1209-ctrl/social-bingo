# แสดง URL ปัจจุบันของระบบ Social Bingo
Write-Host ""
Write-Host "=== Social Bingo URLs ===" -ForegroundColor Cyan

# ดึง URL จาก cloudflared log
$cfLog = "C:\Windows\Temp\cf-tunnel.log"
$url = $null
if (Test-Path $cfLog) {
    $match = Get-Content $cfLog -ErrorAction SilentlyContinue | Select-String "trycloudflare.com" | Select-Object -Last 1
    if ($match -match '"(https://[^"]+trycloudflare\.com)"') {
        $url = $Matches[1]
    }
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
    Write-Host "(cloudflared กำลังเริ่ม หรือ log ไม่พบ)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
pm2 list
