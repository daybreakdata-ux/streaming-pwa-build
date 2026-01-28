import { Hero } from '@/components/streaming/Hero'
import { Carousel } from '@/components/streaming/Carousel'
import type { Title } from '@/lib/types'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

async function fetchFromTMDB(endpoint: string): Promise<Title[]> {
  if (!TMDB_API_KEY) return []
  
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.append('api_key', TMDB_API_KEY)
    url.searchParams.append('page', '1')

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }
    })

    if (!response.ok) return []

    const data = await response.json()

    return data.results.map((item: Record<string, unknown>) => ({
      id: item.id,
      tmdbId: item.id,
      title: item.title || item.name,
      type: item.media_type || (endpoint.includes('/tv/') ? 'tv' : 'movie'),
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdropUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null,
      year: ((item.release_date as string) || (item.first_air_date as string) || '').split('-')[0],
      rating: item.vote_average as number,
      description: item.overview as string,
      genreIds: (item.genre_ids as number[]) || []
    }))
  } catch (error) {
    console.error('TMDB fetch error:', error)
    return []
  }
}

async function getHomeData() {
  const [trending, popularMovies, topRatedMovies, popularTV, topRatedTV] = await Promise.all([
    fetchFromTMDB('/trending/all/week'),
    fetchFromTMDB('/movie/popular'),
    fetchFromTMDB('/movie/top_rated'),
    fetchFromTMDB('/tv/popular'),
    fetchFromTMDB('/tv/top_rated'),
  ])

  return {
    trending,
    popularMovies,
    topRatedMovies,
    popularTV,
    topRatedTV,
  }
}

export default async function HomePage() {
  const { trending, popularMovies, topRatedMovies, popularTV, topRatedTV } = await getHomeData()

  const hasContent = trending.length > 0 || popularMovies.length > 0 || popularTV.length > 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      {trending.length > 0 && <Hero items={trending} />}

      {/* Content Carousels */}
      {hasContent ? (
        <div className={trending.length > 0 ? '-mt-20 relative z-10 pb-16 space-y-2' : 'pt-20 pb-16 space-y-2'}>
          {trending.length > 0 && (
            <Carousel title="Trending Now" items={trending} size="lg" />
          )}
          
          {popularMovies.length > 0 && (
            <Carousel title="Popular Movies" items={popularMovies} />
          )}
          
          {popularTV.length > 0 && (
            <Carousel title="Popular TV Shows" items={popularTV} />
          )}
          
          {topRatedMovies.length > 0 && (
            <Carousel title="Top Rated Movies" items={topRatedMovies} />
          )}
          
          {topRatedTV.length > 0 && (
            <Carousel title="Top Rated TV Shows" items={topRatedTV} />
          )}
        </div>
      ) : (
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Content Loading</h2>
            <p className="text-slate-400 mb-6">
              Please make sure the TMDB_API_KEY environment variable is set in the Vars section of the sidebar to load movies and TV shows.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              StreamHub - Your streaming destination
            </p>
            <p className="text-slate-500 text-xs">
              Powered by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
