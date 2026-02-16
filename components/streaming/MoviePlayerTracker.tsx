'use client'

import { useEffect } from 'react'
import { useWatchHistory } from '@/hooks/use-watch-history'

interface MoviePlayerTrackerProps {
  id: string
  title: string
  posterUrl: string | null
}

export function MoviePlayerTracker({ id, title, posterUrl }: MoviePlayerTrackerProps) {
  const { updateWatchItem } = useWatchHistory()

  useEffect(() => {
    // Update watch history when movie page loads
    updateWatchItem({
      id: parseInt(id),
      title,
      type: 'movie',
      posterUrl,
      currentTime: 0,
      duration: 0,
      lastWatched: Date.now()
    })
  }, [id, title, posterUrl, updateWatchItem])

  return null
}
