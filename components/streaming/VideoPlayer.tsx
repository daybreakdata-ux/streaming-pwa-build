'use client'

import { useMemo, useState } from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface VideoPlayerProps {
  contentType: 'movie' | 'tv'
  id: string | number
  season?: number
  episode?: number
  title?: string
  dsLang?: string
  autoplay?: boolean
  autonext?: boolean
}

// Build Vidsrc embed URL directly based on their API documentation
// Using path-based format which is more reliable:
// Movies: https://vidsrc-embed.ru/embed/movie/{tmdb_id}
// TV Shows: https://vidsrc-embed.ru/embed/tv/{tmdb_id}
// Episodes: https://vidsrc-embed.ru/embed/tv/{tmdb_id}/{season}-{episode}
function buildEmbedUrl(
  contentType: 'movie' | 'tv',
  id: string | number,
  options: {
    season?: number
    episode?: number
    dsLang?: string
    autoplay?: boolean
    autonext?: boolean
  } = {}
): string {
  const baseUrl = 'https://vidsrc-embed.ru/embed'
  const { season, episode, dsLang, autoplay = true, autonext = false } = options
  const tmdbId = String(id)

  // Build optional query params
  const params = new URLSearchParams()
  if (dsLang) params.append('ds_lang', dsLang)
  if (!autoplay) params.append('autoplay', '0')
  if (autonext && contentType === 'tv' && season !== undefined && episode !== undefined) {
    params.append('autonext', '1')
  }
  const queryString = params.toString() ? `?${params.toString()}` : ''

  if (contentType === 'movie') {
    // Movie: https://vidsrc-embed.ru/embed/movie/385687
    return `${baseUrl}/movie/${tmdbId}${queryString}`
  } else if (season !== undefined && episode !== undefined) {
    // Episode: https://vidsrc-embed.ru/embed/tv/1399/1-1
    return `${baseUrl}/tv/${tmdbId}/${season}-${episode}${queryString}`
  } else {
    // TV Show (first episode): https://vidsrc-embed.ru/embed/tv/1399
    return `${baseUrl}/tv/${tmdbId}${queryString}`
  }
}

export function VideoPlayer({
  contentType,
  id,
  season,
  episode,
  title,
  dsLang = 'en',
  autoplay = true,
  autonext = false
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Build embed URL directly - no API call needed
  const embedUrl = useMemo(() => {
    const url = buildEmbedUrl(contentType, id, {
      season,
      episode,
      dsLang,
      autoplay,
      autonext
    })
    console.log('[v0] Vidsrc embed URL:', url)
    return url
  }, [contentType, id, season, episode, dsLang, autoplay, autonext])

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50">
      {loading && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="text-slate-400">Loading player...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-400 font-semibold mb-2">Playback Error</p>
          <p className="text-slate-400 text-sm mb-6 text-center max-w-md px-4">
            Failed to load video player
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      <iframe
        src={embedUrl}
        allowFullScreen
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        title={title || 'Video Player'}
        referrerPolicy="origin"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
      />
    </div>
  )
}
