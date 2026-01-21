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
      type: 'movie' as const,
      posterUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdropUrl: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null,
      year: ((item.release_date as string) || '').split('-')[0],
      rating: item.vote_average as number,
      description: item.overview as string,
      genreIds: (item.genre_ids as number[]) || []
    }))
  } catch (error) {
    console.error('TMDB fetch error:', error)
    return []
  }
}

async function getMoviesData() {
  const [popular, topRated, upcoming, nowPlaying] = await Promise.all([
    fetchFromTMDB('/movie/popular'),
    fetchFromTMDB('/movie/top_rated'),
    fetchFromTMDB('/movie/upcoming'),
    fetchFromTMDB('/movie/now_playing'),
  ])

  return { popular, topRated, upcoming, nowPlaying }
}

export const metadata = {
  title: 'Movies - StreamHub',
  description: 'Browse and watch the latest movies on StreamHub',
}

export default async function MoviesPage() {
  const { popular, topRated, upcoming, nowPlaying } = await getMoviesData()

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Movies</h1>
      </div>

      <div className="space-y-2">
        {nowPlaying.length > 0 && (
          <Carousel title="Now Playing" items={nowPlaying} size="lg" />
        )}
        
        {popular.length > 0 && (
          <Carousel title="Popular Movies" items={popular} />
        )}
        
        {upcoming.length > 0 && (
          <Carousel title="Coming Soon" items={upcoming} />
        )}
        
        {topRated.length > 0 && (
          <Carousel title="Top Rated" items={topRated} />
        )}
      </div>
    </div>
  )
}
