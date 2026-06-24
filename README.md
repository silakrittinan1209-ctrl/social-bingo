# Social Bingo 🎯

เกมบิงโก Real-time สำหรับผู้เล่น 120 คนพร้อมกัน ธีม "พฤติกรรมเสี่ยงบนโซเชียลมีเดีย"

## ติดตั้งและรัน

```bash
npm install
npm run dev
```

## URL ทุกหน้า

| หน้า | URL | คำอธิบาย |
|------|-----|-----------|
| ลงทะเบียน | `/register` | ผู้เล่นกรอกชื่อเล่น + หมู่บ้าน |
| เกม | `/game` | หน้าเล่นบิงโก (4×4) |
| แอดมิน | `/admin` | Dashboard ควบคุมเกม |
| QR Code | `/qr` | QR Code เต็มจอสำหรับโปรเจคเตอร์ |
| Leaderboard | `/leaderboard` | จอโปรเจคเตอร์แสดงผู้ชนะ |

## วิธีหา IP เครื่องสำหรับผู้เล่นสแกน QR

**Windows:**
```
ipconfig
```
ดูที่ `IPv4 Address` เช่น `192.168.1.100`

แล้วให้ผู้เล่นเปิด: `http://192.168.1.100:3000/register`

แก้ไขใน `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://192.168.1.100:3000
```

แล้วรีสตาร์ทเซิร์ฟเวอร์

## วิธีรีเซ็ตเกม

วิธีที่ 1: กดปุ่ม "รีเซ็ตเกม" ในหน้า `/admin`

วิธีที่ 2: เรียก API
```bash
curl -X POST http://localhost:3000/api/reset
```

## วิธี Deploy บน Railway

1. Push โค้ดขึ้น GitHub
2. ไปที่ [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. ตั้ง Environment Variables:
   - `PORT=3000`
   - `NEXT_PUBLIC_SOCKET_URL=https://your-app.railway.app`
4. Railway จะรัน `npm start` อัตโนมัติ

## วิธี Deploy บน VPS

```bash
# Clone และติดตั้ง
git clone <repo>
cd social-bingo
npm install
npm run build

# รันด้วย PM2
npm install -g pm2
pm2 start npm --name "social-bingo" -- start
pm2 save
pm2 startup
```

ตั้ง Nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Tech Stack

- **Next.js 14** (App Router)
- **Socket.IO** (custom server)
- **SQLite** (better-sqlite3)
- **Tailwind CSS**
- **qrcode.react**
- **canvas-confetti**
