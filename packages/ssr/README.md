# @cdl/ssr

CDL Server-Side Rendering and Export Service

Service for rendering CDL charts to PNG, SVG, or PDF on the server side using Puppeteer.

## Installation

```bash
cd packages/ssr
npm install
```

## Usage

### Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000` by default.

### API Endpoints

#### POST /api/export

Export a CDL chart to an image.

**Request:**
```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@lang(data)\nSalesData { month,sales 1月,100 2月,150 }\nChart { use SalesData type line x month y sales }",
    "format": "png",
    "width": 800,
    "height": 600
  }' \
  --output chart.png
```

**Parameters:**
- `source` (string, required) - CDL source code
- `format` (string, optional) - Output format: `png`, `svg`, or `pdf`. Default: `png`
- `width` (number, optional) - Output width in pixels. Default: `800`
- `height` (number, optional) - Output height in pixels. Default: `600`
- `backgroundColor` (string, optional) - Background color. Default: `#ffffff`

**Response:**
- Success: Binary image data with appropriate `Content-Type`
- Error: JSON with `error` field

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-03-15T..."
}
```

## Programmatic Usage

```typescript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/api/export', {
  source: cdlSource,
  format: 'png',
  width: 1024,
  height: 768
}, {
  responseType: 'stream'
});

response.data.pipe(fs.createWriteStream('chart.png'));
```

## Docker

Build and run with Docker:

```bash
docker build -t cdl-ssr .
docker run -p 3000:3000 cdl-ssr
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 3000)
- `PUPPETEER_EXECUTABLE_PATH` - Path to Chrome/Chromium executable
- `CDL_SSR_TIMEOUT` - Render timeout in ms (default: 30000)

## License

MIT