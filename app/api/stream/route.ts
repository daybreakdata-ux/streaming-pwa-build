import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface StreamSource {
  server: string
  url: string | null
  quality?: string
}

// Extract stream URL from VidSrc embed page
async function extractStreamFromEmbed(embedUrl: string): Promise<StreamSource[]> {
  try {
    console.log('[Stream Extractor] Fetching embed page:', embedUrl)
    
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://vidsrc-embed.ru',
      }
    })

    if (!response.ok) {
      throw new Error(`Embed page returned ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const sources: StreamSource[] = []

    // Method 1: Look for iframe source URLs
    $('iframe').each((i, elem) => {
      const src = $(elem).attr('src')
      if (src && (src.includes('vidsrc') || src.includes('embed'))) {
        sources.push({
          server: 'iframe',
          url: src.startsWith('//') ? 'https:' + src : src
        })
      }
    })

    // Method 2: Look for video source tags
    $('video source').each((i, elem) => {
      const src = $(elem).attr('src')
      if (src) {
        sources.push({
          server: 'video',
          url: src.startsWith('//') ? 'https:' + src : src,
          quality: $(elem).attr('quality') || 'auto'
        })
      }
    })

    // Method 3: Look for m3u8 URLs in script tags
    $('script').each((i, elem) => {
      const content = $(elem).html()
      if (content) {
        // Look for .m3u8 URLs
        const m3u8Match = content.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/g)
        if (m3u8Match) {
          m3u8Match.forEach(match => {
            const url = match.replace(/["']/g, '')
            sources.push({
              server: 'hls',
              url: url
            })
          })
        }

        // Look for file or source properties
        const fileMatch = content.match(/(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+)["']/gi)
        if (fileMatch) {
          fileMatch.forEach(match => {
            const urlMatch = match.match(/["'](https?:\/\/[^"']+)["']/)
            if (urlMatch) {
              sources.push({
                server: 'script',
                url: urlMatch[1]
              })
            }
          })
        }
      }
    })

    // Method 4: Look for data attributes
    $('[data-src], [data-url], [data-stream]').each((i, elem) => {
      const src = $(elem).attr('data-src') || $(elem).attr('data-url') || $(elem).attr('data-stream')
      if (src) {
        sources.push({
          server: 'data-attr',
          url: src.startsWith('//') ? 'https:' + src : src
        })
      }
    })

    console.log('[Stream Extractor] Found', sources.length, 'potential sources')
    return sources.filter(s => s.url !== null)

  } catch (error) {
    console.error('[Stream Extractor] Error:', error)
    return []
  }
}

// Follow iframe redirects to get final stream URL
async function resolveIframeChain(iframeUrl: string, depth: number = 0): Promise<string | null> {
  if (depth > 3) return null // Prevent infinite loops
  
  try {
    const response = await fetch(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vidsrc-embed.ru',
      },
      redirect: 'follow'
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    // Look for nested iframes
    const nestedIframe = $('iframe').first().attr('src')
    if (nestedIframe) {
      const fullUrl = nestedIframe.startsWith('//') ? 'https:' + nestedIframe : 
                     nestedIframe.startsWith('http') ? nestedIframe :
                     new URL(nestedIframe, iframeUrl).href
      
      console.log(`[Stream Extractor] Following iframe chain (depth ${depth}):`, fullUrl)
      return resolveIframeChain(fullUrl, depth + 1)
    }

    // Look for direct video sources
    const videoSrc = $('video source').first().attr('src') || $('video').first().attr('src')
    if (videoSrc) {
      return videoSrc.startsWith('//') ? 'https:' + videoSrc : videoSrc
    }

    // Look for m3u8 in scripts
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const content = $(script).html()
      if (content) {
        const m3u8Match = content.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/)
        if (m3u8Match) {
          return m3u8Match[1]
        }
      }
    }

    return null
  } catch (error) {
    console.error('[Stream Extractor] Error in iframe chain:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const tmdbId = searchParams.get('tmdbId')
    const type = searchParams.get('type') as 'movie' | 'tv'
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    if (!tmdbId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: tmdbId and type' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "movie" or "tv"' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (type === 'tv' && (!season || !episode)) {
      return NextResponse.json(
        { error: 'TV shows require season and episode parameters' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Build embed URL
    const embedUrl = type === 'movie'
      ? `https://vidsrc-embed.ru/embed/movie/${tmdbId}`
      : `https://vidsrc-embed.ru/embed/tv/${tmdbId}/${season}/${episode}`

    console.log('[Stream API] Processing:', { tmdbId, type, season, episode })

    // Extract sources from embed page
    const sources = await extractStreamFromEmbed(embedUrl)

    if (sources.length === 0) {
      // Fallback: return embed URL for iframe
      return NextResponse.json({
        success: true,
        embedUrl,
        streams: [{
          name: `${type} ${tmdbId}`,
          streamUrl: null,
          embedUrl: embedUrl,
          referer: 'https://vidsrc-embed.ru'
        }]
      }, { headers: corsHeaders })
    }

    // Try to resolve iframe chains to get direct streams
    const resolvedStreams = await Promise.all(
      sources.slice(0, 3).map(async (source) => {
        if (source.server === 'iframe' && source.url) {
          const resolved = await resolveIframeChain(source.url)
          return resolved ? { ...source, url: resolved, resolved: true } : source
        }
        return source
      })
    )

    // Filter to get best streams (HLS preferred)
    const hlsStreams = resolvedStreams.filter(s => s.url?.includes('.m3u8'))
    const directStreams = resolvedStreams.filter(s => s.url && !s.url.includes('embed'))
    
    const bestStreams = hlsStreams.length > 0 ? hlsStreams : 
                       directStreams.length > 0 ? directStreams : 
                       resolvedStreams

    console.log('[Stream API] Found streams:', {
      total: sources.length,
      hls: hlsStreams.length,
      direct: directStreams.length
    })

    return NextResponse.json({
      success: true,
      embedUrl,
      streams: bestStreams.map(s => ({
        name: `${type} ${tmdbId}`,
        streamUrl: s.url,
        server: s.server,
        quality: s.quality,
        referer: 'https://vidsrc-embed.ru'
      }))
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('[Stream API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract stream',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
