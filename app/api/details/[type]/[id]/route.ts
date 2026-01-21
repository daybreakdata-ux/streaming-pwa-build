import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  if (!id || !type) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  try {
    const endpoint = type === 'tv' 
      ? `${TMDB_BASE_URL}/tv/${id}`
      : `${TMDB_BASE_URL}/movie/${id}`

    const url = new URL(endpoint)
    url.searchParams.append('api_key', TMDB_API_KEY)
    url.searchParams.append('append_to_response', 'credits,videos,similar')

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()

    const details = {
      id: data.id,
      tmdbId: data.id,
      imdbId: data.imdb_id || null,
      title: data.title || data.name,
      tagline: data.tagline,
      type: type,
      posterUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdropUrl: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : null,
      year: (data.release_date || data.first_air_date || '').split('-')[0],
      releaseDate: data.release_date || data.first_air_date,
      rating: data.vote_average,
      voteCount: data.vote_count,
      description: data.overview,
      runtime: data.runtime || (data.episode_run_time?.[0] ?? null),
      genres: data.genres || [],
      status: data.status,
      numberOfSeasons: data.number_of_seasons || null,
      numberOfEpisodes: data.number_of_episodes || null,
      seasons: data.seasons || null,
      cast: data.credits?.cast?.slice(0, 10).map((person: Record<string, unknown>) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profileUrl: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : null
      })) || [],
      trailer: data.videos?.results?.find(
        (v: Record<string, unknown>) => v.type === 'Trailer' && v.site === 'YouTube'
      ) || null,
      similar: data.similar?.results?.slice(0, 10).map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title || item.name,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
          : null,
        rating: item.vote_average,
        type: type
      })) || []
    }

    return NextResponse.json(details, {
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    )
  }
}
