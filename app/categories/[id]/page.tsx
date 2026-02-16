'use client'

import { use, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentGrid } from '@/components/streaming/ContentGrid'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Title } from '@/lib/types'

interface CategoryContentProps {
  params: Promise<{
    id: string
  }>
}

interface APIResponse {
  results: Record<string, unknown>[]
  total_pages: number
  total_results: number
  page: number
}

export default function CategoryPage({ params }: CategoryContentProps) {
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  const genreId = resolvedParams.id
  const genreName = searchParams.get('name') || 'Category'
  
  const [movies, setMovies] = useState<Title[]>([])
  const [tvShows, setTvShows] = useState<Title[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('movies')
  const [moviePage, setMoviePage] = useState(1)
  const [tvPage, setTvPage] = useState(1)
  const [totalMoviePages, setTotalMoviePages] = useState(0)
  const [totalTvPages, setTotalTvPages] = useState(0)

  const ITEMS_PER_LOAD = 4 // Load 4 pages = ~80 items at a time

  const transformMovieData = (items: Record<string, unknown>[]): Title[] =>
    items.map((item) => ({
      id: item.id as number,
      tmdbId: item.id as number,
      title: (item.title || item.name) as string,
      type: 'movie' as const,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdropUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null,
      year: ((item.release_date as string) || '').split('-')[0],
      rating: (item.vote_average as number) || 0,
      description: (item.overview as string) || '',
      genreIds: (item.genre_ids as number[]) || []
    }))

  const transformTVData = (items: Record<string, unknown>[]): Title[] =>
    items.map((item) => ({
      id: item.id as number,
      tmdbId: item.id as number,
      title: (item.title || item.name) as string,
      type: 'tv' as const,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdropUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null,
      year: ((item.first_air_date as string) || '').split('-')[0],
      rating: (item.vote_average as number) || 0,
      description: (item.overview as string) || '',
      genreIds: (item.genre_ids as number[]) || []
    }))

  const fetchMovies = async (page: number, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) setIsLoading(true)
      setIsLoadingMore(true)
      setError(null)

      const allMovies: Title[] = []
      const endPage = Math.min(page + ITEMS_PER_LOAD - 1, totalMoviePages || page + ITEMS_PER_LOAD - 1)

      for (let p = page; p <= endPage; p++) {
        const response = await fetch(
          `/api/genres/by-genre?genreId=${genreId}&type=movie&page=${p}`
        )

        if (!response.ok) throw new Error('Failed to fetch movies')

        const data: APIResponse = await response.json()
        allMovies.push(...transformMovieData(data.results))
        
        if (p === page) {
          setTotalMoviePages(data.total_pages)
        }
      }

      if (isLoadMore) {
        setMovies(prev => [...prev, ...allMovies])
        setMoviePage(endPage + 1)
      } else {
        setMovies(allMovies)
        setMoviePage(endPage + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const fetchTVShows = async (page: number, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) setIsLoading(true)
      setIsLoadingMore(true)
      setError(null)

      const allShows: Title[] = []
      const endPage = Math.min(page + ITEMS_PER_LOAD - 1, totalTvPages || page + ITEMS_PER_LOAD - 1)

      for (let p = page; p <= endPage; p++) {
        const response = await fetch(
          `/api/genres/by-genre?genreId=${genreId}&type=tv&page=${p}`
        )

        if (!response.ok) throw new Error('Failed to fetch TV shows')

        const data: APIResponse = await response.json()
        allShows.push(...transformTVData(data.results))
        
        if (p === page) {
          setTotalTvPages(data.total_pages)
        }
      }

      if (isLoadMore) {
        setTvShows(prev => [...prev, ...allShows])
        setTvPage(endPage + 1)
      } else {
        setTvShows(allShows)
        setTvPage(endPage + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TV shows')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchMovies(1, false)
    fetchTVShows(1, false)
  }, [genreId])

  const handleLoadMoreMovies = () => {
    fetchMovies(moviePage, true)
  }

  const handleLoadMoreTV = () => {
    fetchTVShows(tvPage, true)
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {genreName}
          </h1>
          
          {/* Category Toggle Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('movies')}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
                activeTab === 'movies'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              Movies
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
                activeTab === 'tv'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              TV Shows
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
              <p className="mt-4 text-slate-400">Loading content...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'movies' && (
              <>
                {movies.length > 0 ? (
                  <>
                    <ContentGrid items={movies} />
                    {moviePage <= totalMoviePages && (
                      <div className="flex justify-center pt-8">
                        <button
                          onClick={handleLoadMoreMovies}
                          disabled={isLoadingMore}
                          className={cn(
                            'flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300',
                            'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
                            'hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'active:scale-95'
                          )}
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More
                              <ChevronRight className="h-5 w-5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">
                      No movies found in this category.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'tv' && (
              <>
                {tvShows.length > 0 ? (
                  <>
                    <ContentGrid items={tvShows} />
                    {tvPage <= totalTvPages && (
                      <div className="flex justify-center pt-8">
                        <button
                          onClick={handleLoadMoreTV}
                          disabled={isLoadingMore}
                          className={cn(
                            'flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300',
                            'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
                            'hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'active:scale-95'
                          )}
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More
                              <ChevronRight className="h-5 w-5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">
                      No TV shows found in this category.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
