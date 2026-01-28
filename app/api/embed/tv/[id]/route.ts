import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid title ID' }, { status: 400 })
  }

  try {
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    const isImdb = /^tt\d{7,9}$/.test(id)
    const idParam = isImdb ? `imdb=${id}` : `tmdb=${id}`

    let embedUrl = `https://vidsrc.cc/v2/embed/tv?${idParam}`

    if (season && episode) {
      embedUrl += `&season=${season}&episode=${episode}`
    }

    const dsLang = searchParams.get('ds_lang') || 'en'
    const autoplay = searchParams.get('autoplay') ?? '1'

    embedUrl += `&ds_lang=${dsLang}`
    embedUrl += `&autoplay=${autoplay}`

    return NextResponse.json(
      {
        contentType: season && episode ? 'episode' : 'tv',
        id,
        season: season || null,
        episode: episode || null,
        embedUrl,
        idType: isImdb ? 'imdb' : 'tmdb'
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      }
    )
  } catch (error) {
    console.error('Embed URL generation error:', error)
    return NextResponse.json({ error: 'Failed to generate embed URL' }, { status: 500 })
  }
}
