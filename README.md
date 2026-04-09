# MediaStack-RAD

A visual dashboard for planning and managing your self-hosted media stack. Browse, configure, and simulate the deployment of services like Plex, Sonarr, Radarr, Prowlarr, qBittorrent, Traefik, and more.

> **Important:** This is a UI prototype and planning tool. All install/uninstall actions, health checks, CPU, memory, and uptime metrics are **simulated locally in the browser**. There is no live Docker API integration — no containers are actually created or modified.

## Features

- Visual service grid with category grouping (Infrastructure, Media, Management, Download)
- Dependency-aware install ordering — required deps auto-install first
- Dependency graph view showing service relationships
- Per-service configuration panel (env vars, volumes, health check settings)
- Import services from a `docker-compose.yml` file
- Search and add services directly from Docker Hub
- Dark/light theme toggle

## Running with Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/Nnyan/mediastack-rad.git
cd mediastack-rad

# 2. Copy and edit environment variables
cp .env.example .env
# Edit .env to set your preferred port and optional Traefik settings

# 3. Build and start
docker compose up -d --build

# 4. Open in browser
# http://localhost:8090  (or whatever PORT you set)
```

To stop:
```bash
docker compose down
```

To rebuild after pulling changes:
```bash
docker compose up -d --build
```

### Optional: Traefik reverse proxy

If you're running Traefik (e.g. as part of your mediastack), set these in `.env`:

```env
TRAEFIK_ENABLE=true
TRAEFIK_HOST=mediastack-rad.yourdomain.com
DOCKER_NETWORK=mediastack
NETWORK_EXTERNAL=true
```

Then bring it up without exposing a port directly (Traefik handles routing):
```bash
docker compose up -d --build
```

## Running locally (dev)

```bash
npm install
npm run dev
# → http://localhost:8080
```

## Running tests

```bash
npm test
```

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- TanStack React Query
- js-yaml (for compose file parsing)
- Nginx (production container)
- Vitest

## Project Structure

```
src/
├── components/       # UI components (ServiceGrid, ServiceCard, DependencyMap, ErrorBoundary, etc.)
├── hooks/            # useServices (state management), useTheme
├── lib/
│   ├── services.ts   # Service definitions, dependency resolver, install order
│   └── composeParser.ts  # docker-compose YAML parser + Docker Hub API client
├── pages/            # Index (dashboard), NotFound
└── test/             # Vitest test suite
```

## Roadmap

- Real Docker socket integration via a local backend API
- Persisted configuration (localStorage or config file export)
- Generate a ready-to-use `docker-compose.yml` from selected services
- Configurable base paths and timezone in a Settings panel

## License

MIT
