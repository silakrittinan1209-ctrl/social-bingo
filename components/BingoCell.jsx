'use client'

export default function BingoCell({ text, checked, selectedPlayer, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || checked}
      className={`
        relative w-full aspect-square flex items-center justify-center p-1 rounded-lg border-2
        text-xs leading-tight text-center transition-all duration-200 select-none overflow-hidden
        ${checked
          ? 'bg-indigo-600 border-indigo-700 text-white shadow-inner scale-95'
          : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95'
        }
        ${disabled && !checked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      {checked && selectedPlayer ? (
        /* Checked: show player name */
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600 rounded-lg p-1 gap-0.5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black text-white shrink-0">
            {selectedPlayer.nickname.charAt(0)}
          </div>
          <span className="text-white font-bold text-xs leading-tight line-clamp-2 text-center">
            {selectedPlayer.nickname}
          </span>
          <span className="text-white/60 text-xs leading-none line-clamp-1">
            ✓
          </span>
        </div>
      ) : checked ? (
        /* Checked without player name (fallback) */
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600 rounded-lg p-1">
          <span className="text-white text-xs leading-tight text-center font-medium line-clamp-4">{text}</span>
        </div>
      ) : (
        /* Unchecked */
        <span className="line-clamp-4 font-medium px-0.5">{text}</span>
      )}
    </button>
  )
}
