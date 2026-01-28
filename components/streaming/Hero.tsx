'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

interface HeroProps {
  items: Title[]
}

export function Hero({ items }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const featuredItems = items.filter(item => item.backdropUrl).slice(0, 5)
  const current = featuredItems[currentIndex]

  useEffect(() => {
    if (featuredItems.length <= 1) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredItems.length)
        setIsTransitioning(false)
      }, 500)
    }, 8000)

    return () => clearInterval(interval)
  }, [featuredItems.length])

  if (!current) return null

  return (
    <section className="relative h-[70vh] sm:h-[80vh] min-h-[500px] max-h-[900px] w-full overflow-hidden">
      {/* Background Image */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
      >
        <Image
          src={current.backdropUrl! || "/placeholder.svg"}
          alt={current.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-32">
        <div
          className={cn(
            'max-w-2xl transition-all duration-500',
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={cn(
              'px-3 py-1 rounded text-xs font-bold uppercase tracking-wider',
              current.type === 'tv'
                ? 'bg-purple-600 text-white'
                : 'bg-cyan-600 text-white'
            )}>
              {current.type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            {current.rating > 0 && (
              <div className="flex items-center gap-1.5 text-white">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{current.rating.toFixed(1)}</span>
              </div>
            )}
            {current.year && (
              <span className="text-slate-300">{current.year}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
            {current.title}
          </h1>

          {/* Description */}
          {current.description && (
            <p className="text-base sm:text-lg text-slate-300 line-clamp-3 mb-6 text-pretty">
              {current.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${current.type}/${current.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-black" />
              Play Now
            </Link>
            <Link
              href={`/details/${current.type}/${current.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-700/80 text-white font-semibold hover:bg-slate-600/80 transition-colors"
            >
              <Info className="w-5 h-5" />
              More Info
            </Link>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/60 border border-slate-600/50 text-white hover:bg-slate-700/60 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Pagination Dots */}
        {featuredItems.length > 1 && (
          <div className="absolute bottom-8 right-4 sm:right-8 flex items-center gap-2">
            {featuredItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentIndex(index)
                    setIsTransitioning(false)
                  }, 500)
                }}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 hover:bg-white/60'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
