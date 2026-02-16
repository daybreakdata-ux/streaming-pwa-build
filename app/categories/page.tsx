'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Genre {
  id: number
  name: string
}

export default function CategoriesPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/genres?type=all')
        
        if (!response.ok) {
          throw new Error('Failed to fetch genres')
        }
        
        const data = await response.json()
        setGenres(data.genres)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGenres()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Categories
          </h1>
          <p className="text-slate-400 text-lg">
            Browse movies and TV shows by genre
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-80">
            <div className="animate-pulse space-y-4 w-full max-w-4xl">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-slate-800 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/categories/${genre.id}?name=${encodeURIComponent(genre.name)}`}
                className={cn(
                  'relative h-40 rounded-lg overflow-hidden group cursor-pointer',
                  'bg-gradient-to-br from-slate-800 to-slate-900',
                  'border border-slate-700 hover:border-cyan-500',
                  'transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20',
                  'flex items-center justify-center'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="text-center relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {genre.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
