import { useState, useEffect, useCallback } from 'react'

export interface WatchItem {
  id: number
  title: string
  type: 'movie' | 'tv'
  posterUrl: string | null
  currentTime?: number
  duration?: number
  season?: number
  episode?: number
  totalSeasons?: number
  totalEpisodes?: number
  lastWatched: number // timestamp
}

export interface WatchHistory {
  [key: string]: WatchItem
}

const STORAGE_KEY = 'streamhub_watch_history'
const MAX_ITEMS = 20

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistory>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load watch history:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }, [history, isLoaded])

  const updateWatchItem = useCallback((item: WatchItem) => {
    setHistory((prev) => {
      const updated = { ...prev }
      const key = `${item.type}-${item.id}`

      // Add or update the item
      updated[key] = {
        ...item,
        lastWatched: Date.now()
      }

      // Keep only the most recent MAX_ITEMS
      const entries = Object.entries(updated)
        .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
        .slice(0, MAX_ITEMS)

      return Object.fromEntries(entries)
    })
  }, [])

  const getWatchItem = useCallback((type: 'movie' | 'tv', id: number): WatchItem | null => {
    const key = `${type}-${id}`
    return history[key] || null
  }, [history])

  const getRecentlyWatched = useCallback((): WatchItem[] => {
    return Object.values(history)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 10)
  }, [history])

  const removeWatchItem = useCallback((type: 'movie' | 'tv', id: number) => {
    const key = `${type}-${id}`
    setHistory((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory({})
  }, [])

  return {
    history,
    updateWatchItem,
    getWatchItem,
    getRecentlyWatched,
    removeWatchItem,
    clearHistory,
    isLoaded
  }
}
