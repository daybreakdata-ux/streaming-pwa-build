'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ContentCard } from './ContentCard'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

interface CarouselProps {
  title: string
  items: Title[]
  size?: 'sm' | 'md' | 'lg'
}

export function Carousel({ title, items, size = 'md' }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [items])

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (items.length === 0) return null

  return (
    <section className="relative py-6">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 px-4 sm:px-6 lg:px-8">
        {title}
      </h2>

      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'w-12 h-32 flex items-center justify-center',
            'bg-gradient-to-r from-slate-950 to-transparent',
            'text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'disabled:opacity-0'
          )}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={containerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              item={item}
              priority={index < 6}
              size={size}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'w-12 h-32 flex items-center justify-center',
            'bg-gradient-to-l from-slate-950 to-transparent',
            'text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'disabled:opacity-0'
          )}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </section>
  )
}
