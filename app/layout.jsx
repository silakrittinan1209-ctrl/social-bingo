import './globals.css'

export const metadata = {
  title: 'Social Bingo - พฤติกรรมเสี่ยงบนโซเชียลมีเดีย',
  description: 'เกมบิงโก Real-time ธีมพฤติกรรมเสี่ยงบนโซเชียลมีเดีย',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
