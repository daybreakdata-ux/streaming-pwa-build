'use client'

import { ContentCard } from './ContentCard'
import type { Title } from '@/lib/types'

interface ContentGridProps {
  items: Title[]
  size?: 'sm' | 'md' | 'lg'
}

export function ContentGrid({ items, size = 'md' }: ContentGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-lg">No content found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {items.map((item, index) => (
        <div key={`${item.type}-${item.id}`} className="flex justify-center">
          <ContentCard item={item} priority={index < 12} size={size} />
        </div>
      ))}
    </div>
  )
}
