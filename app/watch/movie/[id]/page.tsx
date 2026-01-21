import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Star, Clock, Calendar, Users } from 'lucide-react'
import { VideoPlayer } from '@/components/streaming/VideoPlayer'
import { Carousel } from '@/components/streaming/Carousel'
import { LoadingSpinner } from '@/components/streaming/LoadingSpinner'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

async function getMovieDetails(id: string) {
  if (!TMDB_API_KEY) {
    return null
  }

  try {
    const url = new URL(`${TMDB_BASE_URL}/movie/${id}`)
    url.searchParams.append('api_key', TMDB_API_KEY)
    url.searchParams.append('append_to_response', 'credits,videos,similar')

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      id: data.id,
      tmdbId: data.id,
      imdbId: data.imdb_id || null,
      title: data.title,
      tagline: data.tagline,
      type: 'movie',
      posterUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdropUrl: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : null,
      year: (data.release_date || '').split('-')[0],
      releaseDate: data.release_date,
      rating: data.vote_average || 0,
      voteCount: data.vote_count,
      description: data.overview,
      runtime: data.runtime,
      genres: data.genres || [],
      cast: data.credits?.cast?.slice(0, 10).map((person: Record<string, unknown>) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profileUrl: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : null
      })) || [],
      similar: data.similar?.results?.slice(0, 10).map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
          : null,
        rating: item.vote_average,
        type: 'movie'
      })) || []
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const movie = await getMovieDetails(id)
  
  if (!movie) {
    return { title: 'Movie Not Found - StreamHub' }
  }
  
  return {
    title: `${movie.title} - StreamHub`,
    description: movie.description?.slice(0, 160) || `Watch ${movie.title} on StreamHub`,
    openGraph: {
      title: movie.title,
      description: movie.description,
      images: movie.backdropUrl ? [movie.backdropUrl] : [],
    }
  }
}

export default async function MovieWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const movie = await getMovieDetails(id)

  if (!movie) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      {/* Video Player Section */}
      <div className="bg-black">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<LoadingSpinner size="lg" text="Loading player..." />}>
            <VideoPlayer
              contentType="movie"
              id={id}
              title={movie.title}
              autoplay={true}
            />
          </Suspense>
        </div>
      </div>

      {/* Movie Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          {movie.posterUrl && (
            <div className="shrink-0 hidden lg:block">
              <div className="relative w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src={movie.posterUrl || "/placeholder.svg"}
                  alt={movie.title}
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
              {movie.title}
            </h1>
            
            {movie.tagline && (
              <p className="text-lg text-cyan-400 italic mb-4">{movie.tagline}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-6">
              {movie.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{movie.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({movie.voteCount?.toLocaleString()} votes)</span>
                </div>
              )}
              {movie.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{movie.year}</span>
                </div>
              )}
              {movie.runtime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre: { id: number; name: string }) => (
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
            {movie.description && (
              <p className="text-slate-300 leading-relaxed mb-8">
                {movie.description}
              </p>
            )}

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                  <Users className="w-5 h-5 text-slate-500" />
                  Cast
                </h3>
                <div className="flex flex-wrap gap-4">
                  {movie.cast.slice(0, 6).map((person: { id: number; name: string; character: string; profileUrl: string | null }) => (
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

        {/* Similar Movies */}
        {movie.similar && movie.similar.length > 0 && (
          <div className="mt-12">
            <Carousel title="More Like This" items={movie.similar} />
          </div>
        )}
      </div>
    </div>
  )
}
