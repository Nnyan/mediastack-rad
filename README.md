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

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- TanStack React Query
- js-yaml (for compose file parsing)
- Vitest + Testing Library

## Getting Started

```bash
# Install dependencies (pick one)
npm install
# or
bun install

# Start the dev server (localhost only)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

The dev server runs on `http://localhost:8080` by default.

## Project Structure

```
src/
├── components/       # UI components (ServiceGrid, ServiceCard, DependencyMap, etc.)
├── hooks/            # useServices (state management), useTheme
├── lib/
│   ├── services.ts   # Service definitions, dependency resolver, install order
│   └── composeParser.ts  # docker-compose YAML parser + Docker Hub API client
├── pages/            # Index (dashboard), NotFound
└── test/             # Vitest test suite
```

## Roadmap / Future Work

- Real Docker socket integration via a local backend API (Node/Python)
- Persisted configuration (localStorage or a config file export)
- Generate a ready-to-use `docker-compose.yml` from selected services
- Configurable base paths and timezone in a Settings panel

## License

MIT
