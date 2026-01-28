'use client'

import Link from "next/link"

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Play, Plus, Star, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

interface ContentCardProps {
  item: Title
  priority?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ContentCard({ item, priority = false, size = 'md' }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const sizeClasses = {
    sm: 'w-32 sm:w-36',
    md: 'w-36 sm:w-44 lg:w-48',
    lg: 'w-44 sm:w-52 lg:w-56'
  }

  const aspectClasses = {
    sm: 'aspect-[2/3]',
    md: 'aspect-[2/3]',
    lg: 'aspect-[2/3]'
  }

  const handleCardClick = () => {
    router.push(`/watch/${item.type}/${item.id}`)
  }

  return (
    <div
      className={cn('group relative shrink-0 cursor-pointer', sizeClasses[size])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      role="button"
      tabIndex={0}
    >
      <div className="block">
        <div
          className={cn(
            'relative rounded-lg overflow-hidden bg-slate-800 transition-all duration-300',
            aspectClasses[size],
            isHovered && 'scale-105 shadow-xl shadow-black/50 ring-2 ring-cyan-500/50'
          )}
        >
          {/* Poster Image */}
          {item.posterUrl && !imageError ? (
            <Image
              src={item.posterUrl || "/placeholder.svg"}
              alt={item.title}
              fill
              className="object-cover"
              sizes={size === 'lg' ? '224px' : size === 'md' ? '192px' : '144px'}
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <Play className="w-12 h-12 text-slate-600" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300',
              isHovered && 'opacity-100'
            )}
          />

          {/* Rating Badge */}
          {item.rating > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold text-white">{item.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2 right-2">
            <span className={cn(
              'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
              item.type === 'tv'
                ? 'bg-purple-600/90 text-white'
                : 'bg-cyan-600/90 text-white'
            )}>
              {item.type === 'tv' ? 'Series' : 'Movie'}
            </span>
          </div>

          {/* Hover Content */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 p-3 translate-y-full transition-transform duration-300',
              isHovered && 'translate-y-0'
            )}
          >
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2">
              {item.title}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
              {item.year && <span>{item.year}</span>}
            </div>

<div className="flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white text-black font-semibold text-xs hover:bg-white/90 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/watch/${item.type}/${item.id}`)
                }}
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Play
              </button>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-md bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="Add to watchlist"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-md bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/details/${item.type}/${item.id}`)
                }}
                aria-label="More info"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
