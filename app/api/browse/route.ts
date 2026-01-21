import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'movie'
  const category = searchParams.get('category') || 'popular'
  const page = parseInt(searchParams.get('page') || '1')

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  if (page < 1) {
    return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 })
  }

  try {
    let endpoint = ''
    
    switch (type) {
      case 'tv':
        endpoint = `${TMDB_BASE_URL}/tv/${category}`
        break
      case 'trending':
        endpoint = `${TMDB_BASE_URL}/trending/all/week`
        break
      case 'movie':
      default:
        endpoint = `${TMDB_BASE_URL}/movie/${category}`
    }

    const url = new URL(endpoint)
    url.searchParams.append('api_key', TMDB_API_KEY)
    url.searchParams.append('page', page.toString())

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()

    const titles = data.results.map((item: Record<string, unknown>) => ({
      id: item.id,
      tmdbId: item.id,
      title: item.title || item.name,
      type: item.media_type || (type === 'tv' ? 'tv' : 'movie'),
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
    }))

    return NextResponse.json(
      {
        contentType: type,
        category,
        page,
        titles,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        hasMore: page < data.total_pages
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  } catch (error) {
    console.error('Browse error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch browse data' },
      { status: 500 }
    )
  }
}
