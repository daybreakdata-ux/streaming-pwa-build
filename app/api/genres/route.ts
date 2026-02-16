import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'movie' // 'movie', 'tv', or 'all' for both

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  try {
    const genres: Record<number, string> = {}

    // Fetch movie genres
    if (type === 'movie' || type === 'all') {
      const movieUrl = new URL(`${TMDB_BASE_URL}/genre/movie/list`)
      movieUrl.searchParams.append('api_key', TMDB_API_KEY)

      const movieResponse = await fetch(movieUrl.toString(), {
        next: { revalidate: 86400 } // Cache for 24 hours
      })

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        movieData.genres.forEach((genre: { id: number; name: string }) => {
          genres[genre.id] = genre.name
        })
      }
    }

    // Fetch TV genres
    if (type === 'tv' || type === 'all') {
      const tvUrl = new URL(`${TMDB_BASE_URL}/genre/tv/list`)
      tvUrl.searchParams.append('api_key', TMDB_API_KEY)

      const tvResponse = await fetch(tvUrl.toString(), {
        next: { revalidate: 86400 } // Cache for 24 hours
      })

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        tvData.genres.forEach((genre: { id: number; name: string }) => {
          genres[genre.id] = genre.name
        })
      }
    }

    // Convert to array format
    const genresList = Object.entries(genres)
      .map(([id, name]) => ({ id: parseInt(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ genres: genresList })
  } catch (error) {
    console.error('Genre fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    )
  }
}
