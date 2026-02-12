'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Maximize } from 'lucide-react'

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

interface StreamData {
  streamUrl: string | null
  embedUrl: string
  server?: string
  quality?: string
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
  const [error, setError] = useState<string | null>(null)
  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [useDirectStream, setUseDirectStream] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Fetch stream data from API
  useEffect(() => {
    async function fetchStream() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          tmdbId: String(id),
          type: contentType,
        })

        if (contentType === 'tv' && season !== undefined && episode !== undefined) {
          params.append('season', String(season))
          params.append('episode', String(episode))
        }

        console.log('[VideoPlayer] Fetching stream from API')
        const response = await fetch(`/api/stream?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stream')
        }

        if (data.streams && data.streams.length > 0) {
          const stream = data.streams[0]
          setStreamData({
            streamUrl: stream.streamUrl,
            embedUrl: data.embedUrl || stream.embedUrl,
            server: stream.server,
            quality: stream.quality
          })

          // Use direct stream if available and is .m3u8
          if (stream.streamUrl && stream.streamUrl.includes('.m3u8')) {
            console.log('[VideoPlayer] Using direct HLS stream')
            setUseDirectStream(true)
          } else {
            console.log('[VideoPlayer] Using iframe embed')
            setUseDirectStream(false)
          }
        } else if (data.embedUrl) {
          setStreamData({
            streamUrl: null,
            embedUrl: data.embedUrl
          })
          setUseDirectStream(false)
        }

        setLoading(false)
      } catch (err) {
        console.error('[VideoPlayer] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stream')
        setLoading(false)
      }
    }

    fetchStream()
  }, [id, contentType, season, episode])

  const handleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black shadow-2xl shadow-black/50" 
      style={{ borderRadius: '0.75rem' }}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              <p className="text-slate-400">Loading stream...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400 font-semibold mb-2">Playback Error</p>
            <p className="text-slate-400 text-sm mb-6 text-center max-w-md px-4">
              {error}
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

        {!loading && !error && streamData && (
          <>
            {useDirectStream && streamData.streamUrl ? (
              // Direct HLS video player
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                autoPlay={autoplay}
                playsInline
                src={streamData.streamUrl}
                onError={(e) => {
                  console.error('[VideoPlayer] Video error, falling back to iframe')
                  setUseDirectStream(false)
                }}
              />
            ) : (
              // Iframe embed fallback
              <iframe
                src={streamData.embedUrl}
                allowFullScreen
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                title={title || 'Video Player'}
                referrerPolicy="origin"
              />
            )}
          </>
        )}

        {/* Custom Fullscreen Button */}
        {!loading && !error && (
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all hover:scale-110"
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
