'use client'
import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import QRCodeDisplay from './QRCodeDisplay'
import TimerDisplay from './TimerDisplay'

const BINGO_ITEMS = [
  'เลื่อนดูโซเชียลเป็นเวลานานเกินความจำเป็น (Doom Scrolling)',
  'เช็กมือถือหรือโซเชียลทุกไม่กี่นาที',
  'ใช้โซเชียลก่อนนอนจนดึกเป็นประจำ',
  'ใช้โซเชียลทันทีหลังตื่นนอน',
  'เสพติดยอดไลก์ ยอดแชร์ และยอดผู้ติดตาม',
  'เปรียบเทียบชีวิตตนเองกับคนอื่นบนโซเชียล',
  'ดูคลิปสั้นต่อเนื่องหลายชั่วโมง',
  'เล่นโซเชียลระหว่างเรียนหรือทำงาน',
  'เล่นโทรศัพท์ขณะเดิน ข้ามถนน หรือขับรถ',
  'แชร์ข้อมูลส่วนตัวมากเกินไป',
  'กดลิงก์หรือดาวน์โหลดไฟล์จากแหล่งที่ไม่น่าเชื่อถือ',
  'เชื่อและแชร์ข่าวปลอมโดยไม่ตรวจสอบ',
  'ซื้อสินค้าตามกระแสหรือรีวิวโดยไม่พิจารณาให้รอบคอบ',
  'มีส่วนร่วมในการดราม่าหรือการโจมตีผู้อื่นทางออนไลน์',
  'ใช้คำพูดรุนแรง แสดงความคิดเห็นด้วยอารมณ์',
  'รับเพื่อน ติดตาม หรือพูดคุยกับคนแปลกหน้าโดยไม่ระมัดระวัง',
]

function formatBingoTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function BingoTypeBadge({ type }) {
  const map = {
    row: { label: '→ แนวนอน', cls: 'bg-blue-100 text-blue-700' },
    col: { label: '↓ แนวตั้ง', cls: 'bg-green-100 text-green-700' },
    diagonal: { label: '✕ ทแยง', cls: 'bg-purple-100 text-purple-700' },
    fullhouse: { label: '👑 Full House', cls: 'bg-yellow-100 text-yellow-700 font-black' },
  }
  const info = map[type] || { label: type, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${info.cls} mr-1`}>
      {info.label}
    </span>
  )
}

export default function AdminDashboard() {
  const { socket, isConnected } = useSocket()
  const [data, setData] = useState(null)
  const [registerUrl, setRegisterUrl] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Timer state
  const [timer, setTimer] = useState({ running: false, timeLeft: 0, totalTime: 0 })
  const [timerInput, setTimerInput] = useState({ min: '10', sec: '0' })
  const [bingoLimitInput, setBingoLimitInput] = useState('0')

  useEffect(() => {
    const origin = window.location.origin
    setRegisterUrl(`${origin}/register`)
  }, [])

  useEffect(() => {
    if (data?.bingoPlayerLimit !== undefined) {
      setBingoLimitInput(String(data.bingoPlayerLimit))
    }
  }, [data?.bingoPlayerLimit])

  useEffect(() => {
    if (!socket) return

    const handleUpdate = (d) => setData(d)
    const handleTimer = (d) => setTimer(d)
    socket.on('admin:update', handleUpdate)
    socket.on('timer:update', handleTimer)
    socket.on('timer:end', () => setTimer((t) => ({ ...t, running: false, timeLeft: 0 })))

    return () => {
      socket.off('admin:update', handleUpdate)
      socket.off('timer:update', handleTimer)
    }
  }, [socket])

  function handleReset() {
    if (!socket) return
    socket.emit('game:reset')
    setShowConfirm(false)
  }

  function handleTimerSet() {
    if (!socket) return
    const totalSeconds = (parseInt(timerInput.min) || 0) * 60 + (parseInt(timerInput.sec) || 0)
    if (totalSeconds <= 0) return
    socket.emit('timer:set', { totalSeconds })
  }

  function handleBingoLimitSet() {
    if (!socket) return
    const limit = parseInt(bingoLimitInput, 10) || 0
    socket.emit('game:bingo-limit', { limit }, (res) => {
      if (res?.ok) setBingoLimitInput(String(res.bingoPlayerLimit || 0))
    })
  }

  function handleGameStart() {
    if (!socket) return
    socket.emit('game:start', (res) => {
      if (res?.ok) setData((prev) => prev ? { ...prev, gameStarted: true } : prev)
    })
  }

  function handleTimerStart() { socket?.emit('timer:start') }
  function handleTimerPause() { socket?.emit('timer:pause') }
  function handleTimerReset() { socket?.emit('timer:reset') }

  const maxCellCount = data?.topCells?.[0]?.count || 1

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">🎯 Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Social Bingo - พฤติกรรมเสี่ยงบนโซเชียลมีเดีย</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="ผู้เล่นทั้งหมด" value={data?.totalPlayers ?? 0} icon="👥" color="blue" />
          <StatCard label="ได้ Bingo แล้ว" value={data?.bingoPlayers ?? 0} icon="🏆" color="yellow" />
          <StatCard label="Full House" value={data?.bingoCount?.fullhouse ?? 0} icon="👑" color="gold" />
          <StatCard
            label="กำลังเล่น"
            value={(data?.totalPlayers ?? 0) - (data?.bingoPlayers ?? 0)}
            icon="🎮"
            color="green"
          />
        </div>

        {/* ── Bingo target control ───────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-300">🎯 จำนวนผู้เล่นที่บิงโกได้</h2>
            <button
              onClick={handleGameStart}
              disabled={data?.gameStarted}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg font-semibold transition-colors"
            >
              {data?.gameStarted ? 'กำลังเล่น' : 'เริ่มเกม'}
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-400 mb-1 block">จำนวนผู้เล่น</label>
              <input
                type="number" min="0"
                value={bingoLimitInput}
                onChange={(e) => setBingoLimitInput(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <button
              onClick={handleBingoLimitSet}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              ตั้งค่า
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {data?.gameStarted
              ? (data?.gameEnded ? 'เกมถูกจบแล้วตามเกณฑ์นี้' : 'เกมกำลังเปิดให้ผู้เล่นเล่นอยู่')
              : 'ยังไม่เริ่มเกม ผู้เล่นจะไม่สามารถเข้าร่วมเล่นได้จนกว่าจะกดเริ่มเกม'}
            {data?.bingoPlayerLimit > 0 && data?.gameStarted && !data?.gameEnded && (
              <span> • เกมจะจบอัตโนมัติเมื่อมีผู้เล่นได้ Bingo แล้ว {data.bingoPlayerLimit} คน</span>
            )}
          </div>
        </div>

        {/* ── Timer Control ─────────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-6">
          <h2 className="font-bold mb-3 text-sm text-gray-300">⏱ ตั้งเวลาเล่น</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: set & controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">นาที</label>
                  <input
                    type="number" min="0" max="120"
                    value={timerInput.min}
                    onChange={(e) => setTimerInput((p) => ({ ...p, min: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="text-gray-400 font-bold mt-5">:</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">วินาที</label>
                  <input
                    type="number" min="0" max="59"
                    value={timerInput.sec}
                    onChange={(e) => setTimerInput((p) => ({ ...p, sec: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleTimerSet}
                  disabled={timer.running}
                  className="mt-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs py-2 px-3 rounded-lg font-semibold transition-colors"
                >
                  ตั้งค่า
                </button>
              </div>
              <div className="flex gap-2">
                {!timer.running ? (
                  <button
                    onClick={handleTimerStart}
                    disabled={timer.timeLeft === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm py-2.5 rounded-xl font-bold transition-colors"
                  >
                    ▶ เริ่ม
                  </button>
                ) : (
                  <button
                    onClick={handleTimerPause}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2.5 rounded-xl font-bold transition-colors"
                  >
                    ⏸ หยุด
                  </button>
                )}
                <button
                  onClick={handleTimerReset}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm py-2.5 rounded-xl font-bold transition-colors"
                >
                  ↺ รีเซ็ต
                </button>
              </div>
              <div className="text-xs text-gray-500">
                ⚡ ทุกหน้าเห็น countdown พร้อมกัน
              </div>
            </div>
            {/* Right: live display */}
            <TimerDisplay
              timeLeft={timer.timeLeft}
              totalTime={timer.totalTime}
              running={timer.running}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* QR Code */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="font-bold mb-3 text-sm text-gray-300">QR Code เข้าร่วมเกม</h2>
            {registerUrl && <QRCodeDisplay url={registerUrl} size={160} />}
            <p className="text-xs text-gray-500 mt-2 break-all text-center">{registerUrl}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => window.open('/qr', '_blank')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-3 rounded-lg font-semibold transition-colors"
              >
                🖥️ QR จอใหญ่
              </button>
              <button
                onClick={() => window.open('/leaderboard', '_blank')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded-lg font-semibold transition-colors"
              >
                📊 Leaderboard
              </button>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-lg font-semibold transition-colors"
            >
              🔄 รีเซ็ตเกม
            </button>
          </div>

          {/* Top cells bar chart */}
          <div className="bg-gray-800 rounded-2xl p-4 lg:col-span-2">
            <h2 className="font-bold mb-3 text-sm text-gray-300">Top 5 ข้อที่ถูกกดมากสุด</h2>
            <div className="space-y-3">
              {data?.topCells?.length > 0 ? (
                data.topCells.map((cell, i) => (
                  <div key={cell.index}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 line-clamp-1 flex-1 mr-2">
                        {i + 1}. {BINGO_ITEMS[cell.index]}
                      </span>
                      <span className="text-yellow-400 font-bold whitespace-nowrap">{cell.count} ครั้ง</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(4, (cell.count / maxCellCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>

        {/* Player table */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <h2 className="font-bold mb-3 text-sm text-gray-300">
            รายชื่อผู้เล่น ({data?.totalPlayers ?? 0} คน)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-700">
                  <th className="text-left py-2 pr-4">ชื่อเล่น</th>
                  <th className="text-left py-2 pr-4">หมู่บ้าน</th>
                  <th className="text-center py-2 pr-4">ช่อง</th>
                  <th className="text-left py-2 pr-4">สถานะ</th>
                  <th className="text-right py-2">เวลา Bingo</th>
                </tr>
              </thead>
              <tbody>
                {data?.players?.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 pr-4 font-medium">{p.nickname}</td>
                    <td className="py-2 pr-4 text-gray-400">{p.village}</td>
                    <td className="py-2 pr-4 text-center text-gray-300">{p.checkedCount}/16</td>
                    <td className="py-2 pr-4">
                      {p.bingoTypes.length === 0 ? (
                        <span className="text-xs text-gray-500">กำลังเล่น</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.bingoTypes.map((t) => (
                            <BingoTypeBadge key={t} type={t} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-400">{formatBingoTime(p.bingoTime)}</td>
                  </tr>
                ))}
                {(!data?.players || data.players.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      ยังไม่มีผู้เล่น
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-xl mb-2">รีเซ็ตเกม?</h3>
            <p className="text-gray-400 text-sm mb-6">
              ผู้เล่นทั้งหมดจะถูกลบออก และเกมจะเริ่มใหม่ทันที
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors"
              >
                รีเซ็ตเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorMap = {
    blue: 'from-blue-600 to-blue-700',
    yellow: 'from-yellow-500 to-orange-500',
    gold: 'from-yellow-400 to-yellow-600',
    green: 'from-green-600 to-emerald-700',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || 'from-gray-700 to-gray-800'} rounded-2xl p-4`}>
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs opacity-80 mt-1">{label}</div>
    </div>
  )
}
