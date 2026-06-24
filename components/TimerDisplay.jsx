'use client'

function pad(n) {
  return String(n).padStart(2, '0')
}

export function formatTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export default function TimerDisplay({ timeLeft, totalTime, running, compact = false }) {
  if (totalTime === 0) return null

  const pct = totalTime > 0 ? timeLeft / totalTime : 0
  const urgent = timeLeft > 0 && timeLeft <= 60
  const ended = timeLeft === 0

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono font-bold
        ${ended ? 'bg-red-500/20 text-red-300'
        : urgent ? 'bg-red-500/20 text-red-300 animate-pulse'
        : running ? 'bg-white/20 text-white'
        : 'bg-white/10 text-white/60'}`}>
        <span>{ended ? '⏹' : running ? '▶' : '⏸'}</span>
        <span>{formatTime(timeLeft)}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl p-4 text-center
      ${ended ? 'bg-red-50 border-2 border-red-300'
      : urgent ? 'bg-orange-50 border-2 border-orange-300'
      : 'bg-white border-2 border-gray-100'}`}>
      <div className={`text-4xl font-black font-mono tracking-wider
        ${ended ? 'text-red-500' : urgent ? 'text-orange-500 animate-pulse' : 'text-gray-800'}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000
            ${ended ? 'bg-red-500' : urgent ? 'bg-orange-400' : 'bg-indigo-500'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className={`text-xs mt-1.5 font-medium
        ${ended ? 'text-red-500' : urgent ? 'text-orange-500' : running ? 'text-indigo-500' : 'text-gray-400'}`}>
        {ended ? '⏹ หมดเวลา!' : running ? '▶ กำลังนับ...' : '⏸ หยุด'}
      </div>
    </div>
  )
}
