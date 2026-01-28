import type { BrowseResponse, SearchResponse, TitleDetails, EmbedResponse } from './types'

const API_BASE = ''

export async function fetchBrowse(
  type: 'movie' | 'tv' | 'trending' = 'movie',
  category: string = 'popular',
  page: number = 1
): Promise<BrowseResponse> {
  const params = new URLSearchParams({
    type,
    category,
    page: page.toString()
  })
  
  const response = await fetch(`${API_BASE}/api/browse?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch browse data')
  }
  return response.json()
}

export async function searchTitles(
  query: string,
  type: 'multi' | 'movie' | 'tv' = 'multi',
  limit: number = 20
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString()
  })
  
  const response = await fetch(`${API_BASE}/api/search?${params}`)
  if (!response.ok) {
    throw new Error('Search failed')
  }
  return response.json()
}

export async function fetchDetails(
  type: 'movie' | 'tv',
  id: number | string
): Promise<TitleDetails> {
  const response = await fetch(`${API_BASE}/api/details/${type}/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch details')
  }
  return response.json()
}

export async function fetchEmbedUrl(
  contentType: 'movie' | 'tv',
  id: string,
  options?: {
    season?: number
    episode?: number
    dsLang?: string
    autoplay?: boolean
  }
): Promise<EmbedResponse> {
  const params = new URLSearchParams()
  
  if (options?.dsLang) params.append('ds_lang', options.dsLang)
  if (options?.autoplay !== undefined) params.append('autoplay', options.autoplay ? '1' : '0')
  if (options?.season) params.append('season', options.season.toString())
  if (options?.episode) params.append('episode', options.episode.toString())
  
  const queryString = params.toString()
  const url = `${API_BASE}/api/embed/${contentType}/${id}${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch embed URL')
  }
  return response.json()
}
