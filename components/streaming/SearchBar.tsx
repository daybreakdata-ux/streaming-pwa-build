'use client'

import React from "react"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { searchTitles } from '@/lib/api'
import type { Title } from '@/lib/types'

interface SearchBarProps {
  onClose?: () => void
  fullPage?: boolean
}

export function SearchBar({ onClose, fullPage = false }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Title[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const data = await searchTitles(searchQuery, 'multi', 8)
      setResults(data.results)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  useEffect(() => {
    if (!fullPage) {
      inputRef.current?.focus()
    }
  }, [fullPage])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
        if (onClose && !fullPage) {
          onClose()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, fullPage])

  const handleResultClick = (item: Title) => {
    router.push(`/watch/${item.type}/${item.id}`)
    setShowResults(false)
    setQuery('')
    onClose?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
      onClose?.()
    }
  }

  return (
    <div ref={containerRef} className={fullPage ? 'w-full' : 'relative'}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search movies, TV shows..."
            className={`
              w-full pl-10 pr-10 py-2.5 rounded-lg
              bg-slate-800/80 border border-slate-700/50
              text-white placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
              transition-all duration-200
              ${fullPage ? 'text-base' : 'text-sm min-w-[280px]'}
            `}
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
          ) : query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className={`
          absolute z-50 mt-2 w-full
          bg-slate-900/98 backdrop-blur-md
          border border-slate-700/50 rounded-xl
          shadow-2xl shadow-black/50
          overflow-hidden
          ${fullPage ? 'relative' : ''}
        `}>
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleResultClick(item)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative w-12 h-16 rounded overflow-hidden bg-slate-800 shrink-0">
                  {item.posterUrl ? (
                    <Image
                      src={item.posterUrl || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Search className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="capitalize">{item.type}</span>
                    {item.year && (
                      <>
                        <span>-</span>
                        <span>{item.year}</span>
                      </>
                    )}
                    {item.rating > 0 && (
                      <>
                        <span>-</span>
                        <span className="text-yellow-500">{item.rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {query.length >= 2 && (
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-3 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/5 border-t border-slate-700/50 transition-colors"
            >
              View all results for &quot;{query}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
