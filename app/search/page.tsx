'use client'

import React from "react"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Film, Tv, SlidersHorizontal, X } from 'lucide-react'
import { ContentGrid } from '@/components/streaming/ContentGrid'
import { LoadingSpinner } from '@/components/streaming/LoadingSpinner'
import { searchTitles } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'
import Loading from './loading'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Title[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all')

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  async function performSearch(searchQuery: string) {
    if (searchQuery.length < 2) return
    
    setLoading(true)
    setSearched(true)
    
    try {
      const data = await searchTitles(searchQuery, 'multi', 40)
      setResults(data.results)
      
      // Update URL
      const params = new URLSearchParams()
      params.set('q', searchQuery)
      router.push(`/search?${params.toString()}`, { scroll: false })
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(item => item.type === filter)

  const movieCount = results.filter(r => r.type === 'movie').length
  const tvCount = results.filter(r => r.type === 'tv').length

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Search</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies, TV shows..."
              className="w-full pl-12 pr-12 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>

          {/* Filter Tabs */}
          {results.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-sm mr-2">
                <SlidersHorizontal className="inline-block w-4 h-4 mr-1" />
                Filter:
              </span>
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                )}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilter('movie')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === 'movie'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                )}
              >
                <Film className="w-4 h-4" />
                Movies ({movieCount})
              </button>
              <button
                onClick={() => setFilter('tv')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === 'tv'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                )}
              >
                <Tv className="w-4 h-4" />
                TV Shows ({tvCount})
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner size="lg" text="Searching..." />
        ) : searched && filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
            <p className="text-slate-400 text-center max-w-md">
              We couldn&apos;t find anything matching &quot;{query}&quot;. Try searching for something else.
            </p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div>
            <p className="text-slate-400 mb-6">
              Showing {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} 
              {query && ` for "${query}"`}
            </p>
            <ContentGrid items={filteredResults} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Start searching</h2>
            <p className="text-slate-400 text-center max-w-md">
              Enter a title to search for movies and TV shows.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  )
}
