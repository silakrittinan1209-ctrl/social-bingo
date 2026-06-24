'use client'
import { useRouter } from 'next/navigation'

const MENU = [
  {
    group: 'สำหรับผู้เล่น',
    items: [
      {
        href: '/register',
        icon: '✍️',
        label: 'ลงทะเบียน',
        desc: 'สมัครเข้าร่วมเกม',
        color: 'from-indigo-500 to-purple-600',
        shadow: 'shadow-indigo-200',
      },
      {
        href: '/game',
        icon: '🎮',
        label: 'เล่นบิงโก',
        desc: 'เข้าสู่ตารางบิงโกของคุณ',
        color: 'from-purple-500 to-pink-500',
        shadow: 'shadow-purple-200',
      },
    ],
  },
  {
    group: 'สำหรับผู้จัดงาน',
    items: [
      {
        href: '/admin',
        icon: '🖥️',
        label: 'Admin Dashboard',
        desc: 'ภาพรวมผู้เล่น / สถิติ / ควบคุมเกม',
        color: 'from-slate-700 to-gray-800',
        shadow: 'shadow-gray-300',
      },
      {
        href: '/qr',
        icon: '📱',
        label: 'QR Code จอใหญ่',
        desc: 'แสดง QR บนโปรเจคเตอร์',
        color: 'from-teal-500 to-cyan-600',
        shadow: 'shadow-teal-200',
      },
      {
        href: '/leaderboard',
        icon: '🏆',
        label: 'Leaderboard',
        desc: 'จอแสดงผลผู้ได้ Bingo',
        color: 'from-yellow-500 to-orange-500',
        shadow: 'shadow-yellow-200',
      },
    ],
  },
]

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10 px-4 text-center shadow-lg">
        <div className="text-5xl mb-3">🎯</div>
        <h1 className="text-3xl font-black tracking-tight">Social Bingo</h1>
        <p className="text-indigo-200 mt-1 text-sm">พฤติกรรมเสี่ยงบนโซเชียลมีเดีย</p>
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {MENU.map((section) => (
          <div key={section.group}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              {section.group}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl
                    bg-gradient-to-r ${item.color} text-white
                    shadow-lg ${item.shadow}
                    active:scale-95 hover:opacity-95 transition-all duration-150
                    text-left
                  `}
                >
                  <span className="text-3xl w-10 text-center shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-base leading-tight">{item.label}</div>
                    <div className="text-white/70 text-xs mt-0.5">{item.desc}</div>
                  </div>
                  <span className="ml-auto text-white/50 text-lg shrink-0">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 pb-8">
        Social Bingo © 2025
      </p>
    </div>
  )
}
