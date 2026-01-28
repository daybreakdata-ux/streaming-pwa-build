'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Star, Calendar, Users, ChevronDown, Play, Tv } from 'lucide-react'
import { VideoPlayer } from '@/components/streaming/VideoPlayer'
import { LoadingSpinner } from '@/components/streaming/LoadingSpinner'
import { cn } from '@/lib/utils'
import Loading from './loading'

interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
}

interface TVDetails {
  id: number
  title: string
  tagline?: string
  description: string
  posterUrl: string | null
  backdropUrl: string | null
  rating: number
  voteCount: number
  year: string
  genres: { id: number; name: string }[]
  numberOfSeasons: number
  numberOfEpisodes: number
  seasons: Season[]
  cast: { id: number; name: string; character: string; profileUrl: string | null }[]
  similar: { id: number; title: string; posterUrl: string | null; rating: number; type: string }[]
}

function TVWatchContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  
  const [show, setShow] = useState<TVDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(parseInt(searchParams.get('season') || '1'))
  const [episode, setEpisode] = useState(parseInt(searchParams.get('episode') || '1'))
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)

  useEffect(() => {
    async function fetchDetails() {
      try {
        const response = await fetch(`/api/details/tv/${id}`)
        if (response.ok) {
          const data = await response.json()
          setShow(data)
        }
      } catch (error) {
        console.error('Failed to fetch TV details:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16 flex items-center justify-center">
        <div className="text-center">
          <Tv className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Show Not Found</h1>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const currentSeason = show.seasons?.find(s => s.season_number === season) || show.seasons?.[0]
  const episodeCount = currentSeason?.episode_count || 10

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Video Player Section */}
      <div className="bg-black">
        <div className="max-w-7xl mx-auto">
          <VideoPlayer
            contentType="tv"
            id={id}
            season={season}
            episode={episode}
            title={`${show.title} - S${season}E${episode}`}
            autoplay={true}
          />
        </div>
      </div>

      {/* Show Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Episode Selector */}
        <div className="bg-slate-900/50 rounded-xl p-6 mb-8 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Now Playing</h2>
            
            {/* Season Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Season {season}
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform',
                  showSeasonDropdown && 'rotate-180'
                )} />
              </button>
              
              {showSeasonDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-20">
                  {show.seasons?.filter(s => s.season_number > 0).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSeason(s.season_number)
                        setEpisode(1)
                        setShowSeasonDropdown(false)
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors',
                        season === s.season_number ? 'bg-cyan-600 text-white' : 'text-slate-300'
                      )}
                    >
                      {s.name}
                      <span className="text-sm text-slate-400 ml-2">
                        ({s.episode_count} episodes)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Episode Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
              <button
                key={ep}
                onClick={() => setEpisode(ep)}
                className={cn(
                  'flex items-center justify-center h-12 rounded-lg font-medium transition-all',
                  episode === ep
                    ? 'bg-cyan-600 text-white scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                {ep}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          {show.posterUrl && (
            <div className="shrink-0 hidden lg:block">
              <div className="relative w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src={show.posterUrl || "/placeholder.svg"}
                  alt={show.title}
                  fill
                  className="object-cover"
                  sizes="256px"
                  priority
                />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {show.title}
            </h1>
            
            {show.tagline && (
              <p className="text-lg text-cyan-400 italic mb-4">{show.tagline}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-6">
              {show.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{show.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({show.voteCount?.toLocaleString()} votes)</span>
                </div>
              )}
              {show.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{show.year}</span>
                </div>
              )}
              {show.numberOfSeasons && (
                <span className="text-slate-400">
                  {show.numberOfSeasons} Season{show.numberOfSeasons > 1 ? 's' : ''}
                </span>
              )}
              {show.numberOfEpisodes && (
                <span className="text-slate-400">
                  {show.numberOfEpisodes} Episode{show.numberOfEpisodes > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Genres */}
            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {show.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {show.description && (
              <p className="text-slate-300 leading-relaxed mb-8">
                {show.description}
              </p>
            )}

            {/* Cast */}
            {show.cast && show.cast.length > 0 && (
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                  <Users className="w-5 h-5 text-slate-500" />
                  Cast
                </h3>
                <div className="flex flex-wrap gap-4">
                  {show.cast.slice(0, 6).map((person) => (
                    <div key={person.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                        {person.profileUrl ? (
                          <Image
                            src={person.profileUrl || "/placeholder.svg"}
                            alt={person.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{person.name}</p>
                        <p className="text-slate-500 text-xs">{person.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TVWatchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TVWatchContent />
    </Suspense>
  )
}
