import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const type = searchParams.get('type') || 'multi'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const tmdbUrl = new URL(`${TMDB_BASE_URL}/search/${type}`)
    tmdbUrl.searchParams.append('api_key', TMDB_API_KEY)
    tmdbUrl.searchParams.append('query', query)
    tmdbUrl.searchParams.append('page', '1')

    const response = await fetch(tmdbUrl.toString(), {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()

    const results = data.results
      .filter((item: Record<string, unknown>) => item.media_type !== 'person')
      .slice(0, limit)
      .map((item: Record<string, unknown>) => {
        const mediaType = item.media_type || type
        const isMovie = mediaType === 'movie'
        return {
          id: item.id,
          tmdbId: item.id,
          title: item.title || item.name,
          type: isMovie ? 'movie' : 'tv',
          posterUrl: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null,
          backdropUrl: item.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
            : null,
          year: ((item.release_date as string) || (item.first_air_date as string) || '').split('-')[0],
          rating: item.vote_average,
          description: item.overview,
          genreIds: item.genre_ids || []
        }
      })

    return NextResponse.json(
      {
        query,
        results,
        total: data.total_results
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300'
        }
      }
    )
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
