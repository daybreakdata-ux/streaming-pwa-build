export interface Title {
  id: number
  tmdbId: number
  imdbId?: string
  title: string
  type: 'movie' | 'tv'
  posterUrl: string | null
  backdropUrl: string | null
  year: string
  rating: number
  description: string
  genreIds: number[]
}

export interface TitleDetails extends Title {
  tagline?: string
  releaseDate: string
  voteCount: number
  runtime: number | null
  genres: { id: number; name: string }[]
  status: string
  numberOfSeasons?: number | null
  numberOfEpisodes?: number | null
  seasons?: Season[] | null
  cast: CastMember[]
  trailer: Trailer | null
  similar: Title[]
}

export interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
}

export interface CastMember {
  id: number
  name: string
  character: string
  profileUrl: string | null
}

export interface Trailer {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export interface BrowseResponse {
  contentType: string
  category: string
  page: number
  titles: Title[]
  totalPages: number
  totalResults: number
  hasMore: boolean
}

export interface SearchResponse {
  query: string
  results: Title[]
  total: number
}

export interface EmbedResponse {
  contentType: string
  id: string
  embedUrl: string
  idType: 'imdb' | 'tmdb'
  season?: string | null
  episode?: string | null
}
