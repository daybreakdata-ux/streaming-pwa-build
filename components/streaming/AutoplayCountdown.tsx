'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoplayCountdownProps {
  show: boolean
  onCancel: () => void
  onAutoplay: () => void
  title: string
  duration?: number
}

export function AutoplayCountdown({
  show,
  onCancel,
  onAutoplay,
  title,
  duration = 10
}: AutoplayCountdownProps) {
  const [countdown, setCountdown] = useState(duration)

  useEffect(() => {
    setCountdown(duration)
  }, [show, duration])

  useEffect(() => {
    if (!show) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onAutoplay()
          return duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [show, onAutoplay, duration])

  if (!show) return null

  const progress = ((duration - countdown) / duration) * 100

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Next Episode
        </h2>
        <p className="text-cyan-400 text-center mb-6 font-semibold">
          {title}
        </p>

        {/* Countdown Circle */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 282.74} 282.74`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-cyan-400">{countdown}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300',
              'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
              'active:scale-95'
            )}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={onAutoplay}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300',
              'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
              'hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30',
              'active:scale-95'
            )}
          >
            Play Now
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
