'use client'

import { useEffect, useState } from 'react'
import { useWatchHistory, WatchItem } from '@/hooks/use-watch-history'
import { Carousel } from './Carousel'
import type { Title } from '@/lib/types'

export function KeepWatchingCarousel() {
  const { getRecentlyWatched, isLoaded } = useWatchHistory()
  const [items, setItems] = useState<Title[]>([])

  useEffect(() => {
    if (isLoaded) {
      const watched = getRecentlyWatched()
      const transformedItems: Title[] = watched.map((item: WatchItem) => ({
        id: item.id,
        tmdbId: item.id,
        title: item.title,
        type: item.type,
        posterUrl: item.posterUrl,
        backdropUrl: null,
        year: '', // We don't store this
        rating: 0, // We don't store this
        description: '',
        genreIds: []
      }))
      setItems(transformedItems)
    }
  }, [isLoaded, getRecentlyWatched])

  if (!isLoaded || items.length === 0) {
    return null
  }

  return (
    <Carousel
      title="Keep Watching"
      items={items}
      size="md"
    />
  )
}
