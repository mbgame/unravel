# Technical Specifications

## Frontend Technology Specs

### Next.js 14 Configuration

```javascript
// apps/frontend/next.config.js
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.railway\.app\/api\/v1\/levels/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'api-levels', expiration: { maxAgeSeconds: 3600 } }
    }
  ]
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei']
  },
  webpack: (config) => {
    // Prevent server-side import of Three.js
    config.externals = config.externals || []
    return config
  }
}

module.exports = withPWA(nextConfig)
```

### Three.js / R3F Specs

**Canvas Configuration:**
```tsx
<Canvas
  camera={{ fov: 60, position: [0, 0, 10], near: 0.1, far: 100 }}
  dpr={[1, Math.min(window.devicePixelRatio, 2)]}
  gl={{
    antialias: false,
    powerPreference: 'high-performance',
    alpha: true,
    localClippingEnabled: true   // Required for unravel clip-plane animation
  }}
  frameloop="always"
>
```

**Yarn Piece Material:**
```typescript
// Core material (hidden beneath spirals)
new MeshStandardMaterial({
  color: new Color(hex).multiplyScalar(0.48),  // darkened
  roughness: 0.88, metalness: 0.02,
  side: DoubleSide,
  clippingPlanes: [clipPlane],  // permanently attached, constant toggled
})

// Spiral/surface material — knit texture tinted with colour
new MeshStandardMaterial({
  map: knitTexture,  // one of knit1–knit6.jpg
  color: new Color(hex),
  emissive: new Color(hex),
  emissiveIntensity: 0.38,
  roughness: 0.78,  // custom parts (house/tree)
  clippingPlanes: [clipPlane],
})
```

**Textures:**
```
/assets/textures/yarn/string.png     — Thread texture for unravel animation
/assets/textures/yarn/knit1.jpg      — Knit fabric texture variant 1
/assets/textures/yarn/knit2.jpg      — Knit fabric texture variant 2
/assets/textures/yarn/knit3.jpg      — Knit fabric texture variant 3
/assets/textures/yarn/knit4.jpg      — Knit fabric texture variant 4
/assets/textures/yarn/knit5.jpg      — Knit fabric texture variant 5
/assets/textures/yarn/knit6.jpg      — Knit fabric texture variant 6
```
Each yarn object gets a deterministic texture based on its stack ID hash.

**Performance Budgets:**
```
Draw calls per frame:  < 50
Triangles per frame:   < 100,000
Textures in GPU:       < 10
Memory (GPU):          < 128MB
Memory (JS heap):      < 100MB
```

---

### Zustand Store Specs

```typescript
// yarnGameStore — core yarn collecting game state
interface YarnGameState {
  phase: 'idle' | 'playing' | 'won' | 'lost'
  levelNumber: number
  formationName: string
  totalBalls: number
  clearedBalls: number
  leftCollector:  { color: string | null; count: number }  // 0–3
  rightCollector: { color: string | null; count: number }  // 0–3
  celebration: { side: 'left'|'right'; color: string; time: number } | null
  bufferStack: { id: string; color: string }[]  // max 5

  initLevel: (level, name, total, color1, color2) => void
  addToCollector: (side) => boolean   // returns true when 3/3 filled
  clearCollector: (side, newColor) => void
  addToBuffer: (id, color) => void
  releaseFromBuffer: (color) => number
  clearBalls: (count) => void
}

// uiStore — modals, toasts, zoom
interface UiState {
  activeModal: 'pause' | 'levelComplete' | 'settings' | 'hint' | null
  toasts: Toast[]
  isPaused: boolean
  zoom: number  // -1 (out) to +1 (in), drives camera distance via OrbitControls
}

// debugStore (via Leva useDebugStore) — real-time animation/lighting/colour tunables
interface DebugValues {
  unravelDuration: number   // 0.85
  travelDuration: number    // 0.6
  flyDuration: number       // 0.35
  spawnDuration: number     // 0.1
  zigzagRowHeight: number   // 0.04
  threadRadius: number      // 0.01
  spindleTurns: number      // 3.0
  arcHeight: number         // 0.15
  ambientIntensity: number  // 1.6
  keyLightIntensity: number // 1.2
  // ... (full list in DebugPanel.tsx)
  houseBlue: string         // '#7EC8E3'
  houseGreen: string        // '#A8D5A2'
  houseOrange: string       // '#F4B183'
}
```

---

### API Client Spec

```typescript
// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Request: attach access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt refresh
      const refreshed = await refreshAccessToken()
      if (refreshed) return apiClient(error.config)
      else logout()
    }
    return Promise.reject(error)
  }
)
```

---

## Backend Technology Specs

### NestJS Configuration

```typescript
// apps/backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  // Security
  app.use(helmet())
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  // Versioning
  app.setGlobalPrefix('api/v1')

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,        // Auto-transform types
    transformOptions: { enableImplicitConversion: true }
  }))

  // Response format
  app.useGlobalInterceptors(new TransformInterceptor())
  
  // Error format
  app.useGlobalFilters(new AllExceptionsFilter())

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Unravel Master API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.listen(process.env.PORT || 3001)
}
```

### TypeORM Configuration

```typescript
// apps/backend/src/config/database.config.ts
export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }  // Railway uses self-signed cert
    : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,  // NEVER true in production
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: true, // Auto-run on startup
})
```

### JWT Configuration

```typescript
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN', '15m'),
      issuer: 'unravel-master',
    },
  }),
})
```

### Rate Limiting

```typescript
ThrottlerModule.forRoot([
  { name: 'short',  ttl: 1000,  limit: 10 },   // 10 req/s
  { name: 'medium', ttl: 60000, limit: 100 },   // 100 req/min
  { name: 'long',   ttl: 3600000, limit: 1000 } // 1000 req/hour
])

// Override for score submission (stricter):
@Throttle({ medium: { limit: 10 } })
@Post('scores')
async submitScore() {}
```

---

## Knot Algorithm Spec

### Knot Representation
```typescript
// A knot is stored as an ordered list of crossings
// At each crossing, one strand goes OVER the other

// Example: Trefoil knot data stored in DB as JSONB
{
  "nodes": [
    { "id": "n1", "position": [0, 1, 0], "isFixed": false },
    { "id": "n2", "position": [0.87, -0.5, 0], "isFixed": false },
    { "id": "n3", "position": [-0.87, -0.5, 0], "isFixed": false }
  ],
  "edges": [
    { "id": "e1", "from": "n1", "to": "n2", "stringId": "s1", "over": true },
    { "id": "e2", "from": "n2", "to": "n3", "stringId": "s1", "over": false },
    { "id": "e3", "from": "n3", "to": "n1", "stringId": "s1", "over": true }
  ],
  "strings": [
    { "id": "s1", "color": "#FF6B6B", "nodeSequence": ["n1","n2","n3"] }
  ]
}
```

### Untangle Detection Algorithm
```typescript
// Simplified: check if any two edges cross in screen-projected space
function isUntangled(graph: KnotGraph, camera: Camera): boolean {
  const projected = projectToScreen(graph.nodes, camera)
  
  for (let i = 0; i < graph.edges.length; i++) {
    for (let j = i + 1; j < graph.edges.length; j++) {
      const edge1 = graph.edges[i]
      const edge2 = graph.edges[j]
      
      // Skip edges that share a node
      if (sharesNode(edge1, edge2)) continue
      
      // Check 2D intersection in screen space
      if (intersects2D(
        projected[edge1.from], projected[edge1.to],
        projected[edge2.from], projected[edge2.to]
      )) {
        return false  // Still tangled
      }
    }
  }
  
  return true  // No crossings found!
}
```

### Score Formula
```typescript
function calculateScore(params: {
  levelDifficulty: number,  // 1-10
  timeMs: number,
  moves: number,
  hintsUsed: number,
  parTimeMs: number,
  parMoves: number,
}): number {
  const BASE = 1000 * params.levelDifficulty
  
  // Time bonus/penalty (±200 points max)
  const timeDelta = params.parTimeMs - params.timeMs
  const timeBonus = Math.max(-200, Math.min(200, Math.floor(timeDelta / 1000) * 10))
  
  // Moves penalty (5 points per extra move)
  const extraMoves = Math.max(0, params.moves - params.parMoves)
  const movePenalty = extraMoves * 5
  
  // Hint penalty (100 points per hint)
  const hintPenalty = params.hintsUsed * 100
  
  return Math.max(0, BASE + timeBonus - movePenalty - hintPenalty)
}
```

---

## Mobile Performance Spec

### Touch Event Handling
```typescript
// Use Pointer Events API for unified touch/mouse
canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
canvas.addEventListener('pointermove', onPointerMove, { passive: true })
canvas.addEventListener('pointerup', onPointerUp)

// Prevent scroll hijacking on canvas
canvas.style.touchAction = 'none'

// Gesture detection
const gesture = {
  type: null as 'rotate' | 'pinch' | null,
  startDistance: 0,
  startScale: 1,
}
```

### Quality Auto-Detection
```typescript
import { getGPUTier } from 'detect-gpu'

async function detectQualityTier(): Promise<'LOW' | 'MEDIUM' | 'HIGH'> {
  const gpuTier = await getGPUTier()
  
  if (gpuTier.tier <= 1) return 'LOW'
  if (gpuTier.tier === 2) return 'MEDIUM'
  return 'HIGH'
}

// Runtime FPS monitoring
let frameCount = 0
let lowFpsFrames = 0
const TARGET_FPS = 50

useFrame((_, delta) => {
  const fps = 1 / delta
  if (fps < TARGET_FPS) lowFpsFrames++
  else lowFpsFrames = Math.max(0, lowFpsFrames - 1)
  
  // If low FPS for 120 frames (~2s), downgrade
  if (lowFpsFrames > 120) {
    downgradeQuality()
    lowFpsFrames = 0
  }
})
```

### PWA Manifest
```json
{
  "name": "Unravel Master",
  "short_name": "Unravel",
  "description": "Untangle knots in this 3D puzzle game",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    { "src": "/screenshots/gameplay.png", "sizes": "390x844", "type": "image/png" }
  ]
}
```

---

## Testing Spec

### Frontend (Vitest)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 70, functions: 70, branches: 65 }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

### Backend (Jest)
```typescript
// jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { lines: 70, functions: 70 }
  }
}
```

---

## Environment Variables Reference

### Frontend (`NEXT_PUBLIC_*` = exposed to browser)
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:3001/api/v1` | Backend API URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Frontend URL (for og:url etc.) |

### Backend
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | `<64 char random>` | JWT signing secret |
| `JWT_REFRESH_SECRET` | ✅ | `<64 char random>` | Refresh token secret |
| `JWT_EXPIRES_IN` | ✅ | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | `7d` | Refresh token lifetime |
| `PORT` | ✅ | `3001` | Server port |
| `CORS_ORIGIN` | ✅ | `http://localhost:3000` | Allowed frontend origin |
| `NODE_ENV` | ✅ | `development` | Environment |
