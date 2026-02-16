import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const genreId = searchParams.get('genreId')
  const type = searchParams.get('type') || 'movie' // 'movie' or 'tv'
  const page = parseInt(searchParams.get('page') || '1')

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  if (!genreId) {
    return NextResponse.json(
      { error: 'genreId parameter is required' },
      { status: 400 }
    )
  }

  if (page < 1) {
    return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 })
  }

  try {
    const url = new URL(
      type === 'tv'
        ? `${TMDB_BASE_URL}/discover/tv`
        : `${TMDB_BASE_URL}/discover/movie`
    )

    url.searchParams.append('api_key', TMDB_API_KEY)
    url.searchParams.append('with_genres', genreId)
    url.searchParams.append('page', page.toString())
    url.searchParams.append('sort_by', 'popularity.desc')

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      results: data.results,
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page
    })
  } catch (error) {
    console.error('Genre filter error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content by genre' },
      { status: 500 }
    )
  }
}
