# Stream Extraction Backend

Fully integrated stream backend API that extracts direct stream URLs from embedded video players and converts embedded streams into direct playback URLs. All functionality is built into the Next.js application with no external backend dependencies.

## Architecture Overview

The streaming backend is fully self-contained within the application:

- **Next.js API Routes**: Handle all stream extraction logic (`/api/stream`)
- **TMDB API**: Provides content metadata and IDs
- **VidSrc Direct Integration**: Fetches and parses embedded stream URLs directly from vidsrc.cc and vidsrc.xyz
- **Stream Extraction**: Runs on the server-side, converting embedded iframes into direct playable streams

## Deployment

**Production URL**: https://streamhub.daybreakdev.com

Deployed on Vercel with:
- Server-side stream extraction (Node.js runtime)
- Direct VidSrc integration (no proxy backend needed)
- Cached stream responses

## Features

- **Direct Stream Extraction**: Parses embed pages to find direct video URLs
- **Multiple Detection Methods**: 
  - iframe source URLs
  - video source tags
  - HLS (.m3u8) links in scripts
  - data attributes
- **Iframe Chain Resolution**: Follows nested iframes to find final stream
- **Automatic Fallback**: Returns embed URL if extraction fails
- **Smart Player Selection**: Uses direct HLS player when available, iframe otherwise
- **Vercel Optimized**: Deployed serverless, fully compatible with edge runtime

## API Endpoint

### GET `/api/stream`

Extract stream URLs from TMDB content.

**Query Parameters:**
- `tmdbId` (required): TMDB ID of the movie/TV show
- `type` (required): Either `movie` or `tv`
- `season` (required for TV): Season number
- `episode` (required for TV): Episode number

**Example Requests:**

```bash
# Movie
curl "https://streamhub.daybreakdev.com/api/stream?tmdbId=550&type=movie"

# TV Episode
curl "https://streamhub.daybreakdev.com/api/stream?tmdbId=1399&type=tv&season=1&episode=1"
```

**Response Format:**

```json
{
  "success": true,
  "embedUrl": "https://vidsrc.xyz/embed/movie/550",
  "streams": [
    {
      "name": "movie 550",
      "streamUrl": "https://example.com/stream.m3u8",
      "server": "hls",
      "quality": "auto",
      "referer": "https://vidsrc.xyz"
    }
  ]
}
```

## How It Works

### 1. Embed Page Parsing

The API fetches the VidSrc embed page and uses Cheerio to parse the HTML for:

- **iframe tags**: Nested embed sources
- **video source tags**: Direct HTML5 video sources
- **script content**: JavaScript containing m3u8 URLs
- **data attributes**: data-src, data-url, data-stream

### 2. Iframe Chain Resolution

When an iframe is found, the API:
1. Fetches the iframe content
2. Looks for nested iframes (up to 3 levels deep)
3. Searches for direct video sources
4. Returns the final stream URL

### 3. Stream Prioritization

The API prioritizes streams in this order:
1. **HLS streams** (.m3u8 files) - Best for adaptive streaming
2. **Direct video URLs** - Non-embed video sources
3. **Embed URLs** - Fallback iframe embed

### 4. Client-Side Handling

The VideoPlayer component:
- Fetches stream data from `/api/stream`
- Uses HTML5 `<video>` player for direct HLS streams
- Falls back to `<iframe>` if no direct stream found
- Automatically retries with iframe on video error

## Extraction Methods

### Method 1: iframe Sources
```html
<iframe src="https://embed.example.com/video"></iframe>
```

### Method 2: video Tags
```html
<video>
  <source src="https://cdn.example.com/video.m3u8" type="application/x-mpegURL">
</video>
```

### Method 3: Script Detection
```javascript
// Looks for patterns like:
var file = "https://cdn.example.com/stream.m3u8";
source: "https://example.com/video.mp4"
```

### Method 4: Data Attributes
```html
<div data-stream="https://cdn.example.com/video.m3u8"></div>
```

## Testing

### Test the API

```bash
# Test movie extraction (Production)
curl "https://streamhub.daybreakdev.com/api/stream?tmdbId=872585&type=movie" | jq .

# Test TV show extraction (Production)
curl "https://streamhub.daybreakdev.com/api/stream?tmdbId=1399&type=tv&season=1&episode=1" | jq .

# Local Development
curl "http://localhost:3000/api/stream?tmdbId=872585&type=movie" | jq .
curl "http://localhost:3000/api/stream?tmdbId=1399&type=tv&season=1&episode=1" | jq .
```

### Check Logs

The API logs detailed information:
- Embed URLs being fetched
- Number of sources found
- Stream types detected (HLS, direct, etc.)

Look for console output like:
```
[Stream Extractor] Fetching embed page: https://vidsrc.xyz/embed/movie/550
[Stream Extractor] Found 3 potential sources
[Stream API] Found streams: { total: 3, hls: 1, direct: 2 }
```

## Limitations

### Current Challenges

1. **Cloudflare Protection**: Some embed sites use bot protection
2. **Dynamic Content**: JavaScript-rendered streams may not be detected
3. **Encryption**: Some sources use encrypted manifests
4. **CORS Restrictions**: Direct streams may have CORS headers

### Workarounds

- API tries multiple extraction methods
- Automatic fallback to iframe embed
- Client-side error recovery
- User-agent spoofing for better access

## Future Improvements

- [ ] Support for more embed providers (Vimeo, Dailymotion, etc.)
- [ ] Puppeteer integration for JavaScript-heavy pages
- [ ] Stream quality detection and selection
- [ ] Subtitle extraction
- [ ] Caching of extracted streams
- [ ] Rate limiting and request queuing

## Architecture

```
User Request (VideoPlayer Component)
    ↓
/api/stream endpoint (Next.js API Route)
    ↓
┌──────────────────────────────────────────┐
│ Build VidSrc Embed URL from TMDB ID      │
│ - Movies: vidsrc.cc/embed/movie/{id}     │
│ - TV: vidsrc.cc/embed/tv/{id}/{s}/{e}    │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ Fetch & Parse Embed Page (Cheerio)       │
│ - Extract iframe sources                 │
│ - Extract video source tags              │
│ - Search script content for m3u8 URLs    │
│ - Check data attributes                  │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ Resolve Iframe Chains                    │
│ - Follow nested iframes (max 3 levels)   │
│ - Extract final stream URL               │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│ Prioritize Streams                       │
│ 1. HLS (.m3u8) - best for video         │
│ 2. Direct URLs - non-iframe sources     │
│ 3. Embed fallback - original iframe     │
└──────────────────────────────────────────┘
    ↓
Return JSON Response with Stream Data
    ↓
VideoPlayer Component
    ↓
Render HTML5 <video> or <iframe>
```

## Integrated API Routes

All API routes are part of the main application:

### Content APIs

- **GET `/api/browse`** - Browse movies/TV by category (TMDB)
- **GET `/api/search`** - Search for content (TMDB)
- **GET `/api/details/[type]/[id]`** - Get content details (TMDB)
- **GET `/api/embed/[type]/[id]`** - Generate embed URL (VidSrc)

### Stream APIs

- **GET `/api/stream`** - Extract direct stream URLs (VidSrc + local parsing)

All endpoints run on the same application with no external backend required.

## Vercel Deployment

### Setup

1. **Required Environment Variables** (set in Vercel dashboard):
   ```
   TMDB_API_KEY=your_tmdb_api_key
   ```

2. **Build Configuration**:
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Install Command: `pnpm install --frozen-lockfile`
   - Output Directory: `.next`

3. **Function Configuration**:
   - Stream API endpoint uses Node.js runtime
   - Max duration: 60 seconds for stream extraction timeout
   - No external API backend calls required
   - All stream extraction happens on-server

### Deployment Steps

1. Connect repository to Vercel
2. Set `TMDB_API_KEY` in Vercel dashboard
3. Click "Deploy"
4. Configure custom domain (streamhub.daybreakdev.com)

### Key Features

- **Zero External Backend**: All stream extraction integrated into the application
- **Direct VidSrc Integration**: Parses VidSrc embed pages without proxy
- **Fast Extraction**: Server-side extraction with caching
- **Error Resilience**: Automatic fallback to iframe if extraction fails
- **CORS Compatible**: Proper headers for cross-domain playback

### Monitoring

- Stream extraction logs in Vercel dashboard
- Error tracking for failed extractions
- Performance metrics for API response times

## Error Handling

The API provides graceful degradation:

1. **Extraction fails**: Returns embed URL for iframe fallback
2. **Network error**: Returns 500 with error details
3. **Invalid parameters**: Returns 400 with validation message
4. **Stream not playable**: Client falls back to iframe automatically

## Dependencies

- **Next.js**: Server API routes
- **Cheerio**: HTML parsing and DOM manipulation
- **Native Fetch**: HTTP requests
