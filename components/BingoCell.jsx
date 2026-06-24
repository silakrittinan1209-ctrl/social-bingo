'use client'

export default function BingoCell({ text, checked, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || checked}
      className={`
        relative w-full aspect-square flex items-center justify-center p-1 rounded-lg border-2
        text-xs leading-tight text-center transition-all duration-200 select-none
        ${
          checked
            ? 'bg-indigo-600 border-indigo-700 text-white shadow-inner scale-95'
            : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95'
        }
        ${disabled && !checked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      <span className="line-clamp-4 font-medium">{text}</span>
      {checked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-600 rounded-lg opacity-90" />
          <svg
            className="relative w-8 h-8 text-white opacity-30"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="relative text-white text-xs leading-tight text-center px-1 font-medium line-clamp-4">
            {text}
          </span>
        </div>
      )}
    </button>
  )
}
