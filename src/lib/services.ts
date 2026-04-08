export type ServiceStatus = "running" | "stopped" | "error" | "healing" | "installing";

export interface EnvVar {
  key: string;
  value: string;
  description: string;
  secret?: boolean;
}

export interface VolumeMount {
  host: string;
  container: string;
  description: string;
}

export interface ServiceDependency {
  serviceId: string;
  type: "required" | "optional";
  description: string;
}

export interface HealthCheck {
  type: "http" | "tcp" | "exec";
  endpoint?: string;
  interval: number;
  timeout: number;
  retries: number;
}

export interface ServiceConfig {
  envVars: EnvVar[];
  volumes: VolumeMount[];
  dependencies: ServiceDependency[];
  healthCheck: HealthCheck;
  network: string;
  restartPolicy: "always" | "unless-stopped" | "on-failure";
  image: string;
  tag: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: "download" | "media" | "management" | "infrastructure";
  port?: number;
  installed: boolean;
  status: ServiceStatus;
  uptime?: string;
  cpu?: number;
  memory?: number;
  healthChecks: number;
  lastHealed?: string;
  config: ServiceConfig;
  autoConfigured: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  media: "Media Servers",
  management: "Media Management",
  download: "Download Clients",
};

export const CATEGORY_ORDER = ["infrastructure", "media", "management", "download"];

const MEDIA_NETWORK = "mediastack";
const BASE_DATA = "/opt/mediastack";
const MEDIA_PATH = "/mnt/media";

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: "download" | "media" | "management" | "infrastructure";
  port?: number;
  config: ServiceConfig;
}

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // ── Infrastructure ──
  {
    id: "traefik",
    name: "Traefik",
    description: "Cloud-native reverse proxy and load balancer with automatic service discovery",
    category: "infrastructure",
    port: 8081,
    config: {
      image: "traefik",
      tag: "v3.1",
      network: MEDIA_NETWORK,
      restartPolicy: "always",
      envVars: [
        { key: "TRAEFIK_API_DASHBOARD", value: "true", description: "Enable Traefik dashboard" },
        { key: "TRAEFIK_ENTRYPOINTS_WEB_ADDRESS", value: ":80", description: "HTTP entrypoint" },
        { key: "TRAEFIK_ENTRYPOINTS_WEBSECURE_ADDRESS", value: ":443", description: "HTTPS entrypoint" },
        { key: "TRAEFIK_PROVIDERS_DOCKER", value: "true", description: "Enable Docker provider" },
        { key: "TRAEFIK_PROVIDERS_DOCKER_EXPOSEDBYDEFAULT", value: "false", description: "Don't expose all containers" },
        { key: "TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_EMAIL", value: "admin@example.com", description: "ACME email for Let's Encrypt", secret: false },
        { key: "TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_STORAGE", value: "/letsencrypt/acme.json", description: "ACME cert storage path" },
        { key: "TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_HTTPCHALLENGE_ENTRYPOINT", value: "web", description: "HTTP challenge entrypoint" },
      ],
      volumes: [
        { host: "/var/run/docker.sock", container: "/var/run/docker.sock", description: "Docker socket for auto-discovery" },
        { host: `${BASE_DATA}/traefik/letsencrypt`, container: "/letsencrypt", description: "TLS certificate storage" },
        { host: `${BASE_DATA}/traefik/config`, container: "/etc/traefik", description: "Traefik configuration" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/api/rawdata", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "cloudflared",
    name: "Cloudflared",
    description: "Secure tunnel to expose services via Cloudflare without opening ports",
    category: "infrastructure",
    config: {
      image: "cloudflare/cloudflared",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "always",
      envVars: [
        { key: "TUNNEL_TOKEN", value: "", description: "Cloudflare Tunnel token from Zero Trust dashboard", secret: true },
        { key: "TUNNEL_TRANSPORT_PROTOCOL", value: "quic", description: "Tunnel transport protocol" },
      ],
      volumes: [
        { host: `${BASE_DATA}/cloudflared`, container: "/etc/cloudflared", description: "Cloudflared configuration" },
      ],
      dependencies: [
        { serviceId: "traefik", type: "optional", description: "Routes tunnel traffic through Traefik" },
      ],
      healthCheck: { type: "exec", interval: 30, timeout: 10, retries: 5 },
    },
  },
  {
    id: "letsencrypt",
    name: "Let's Encrypt",
    description: "Automated TLS/SSL certificate management via Traefik ACME resolver",
    category: "infrastructure",
    config: {
      image: "traefik", // Managed by Traefik
      tag: "v3.1",
      network: MEDIA_NETWORK,
      restartPolicy: "always",
      envVars: [
        { key: "ACME_EMAIL", value: "admin@example.com", description: "Email for certificate notifications" },
        { key: "ACME_CA_SERVER", value: "https://acme-v02.api.letsencrypt.org/directory", description: "ACME CA server URL" },
        { key: "ACME_STORAGE", value: "/letsencrypt/acme.json", description: "Certificate storage file" },
      ],
      volumes: [
        { host: `${BASE_DATA}/traefik/letsencrypt`, container: "/letsencrypt", description: "Shared cert storage with Traefik" },
      ],
      dependencies: [
        { serviceId: "traefik", type: "required", description: "Let's Encrypt is managed as a Traefik certificate resolver" },
      ],
      healthCheck: { type: "exec", interval: 3600, timeout: 30, retries: 3 },
    },
  },
  {
    id: "dockhand",
    name: "Dockhand",
    description: "Container orchestration, auto-updates, and lifecycle management",
    category: "infrastructure",
    port: 3100,
    config: {
      image: "dockhand/dockhand",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "always",
      envVars: [
        { key: "DOCKHAND_POLL_INTERVAL", value: "300", description: "Update check interval in seconds" },
        { key: "DOCKHAND_NOTIFICATIONS", value: "true", description: "Enable update notifications" },
        { key: "DOCKHAND_CLEANUP", value: "true", description: "Auto-cleanup old images" },
      ],
      volumes: [
        { host: "/var/run/docker.sock", container: "/var/run/docker.sock", description: "Docker socket for container management" },
        { host: `${BASE_DATA}/dockhand`, container: "/config", description: "Dockhand configuration" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/health", interval: 60, timeout: 10, retries: 3 },
    },
  },

  // ── Media ──
  {
    id: "plex",
    name: "Plex",
    description: "Premium media server for streaming movies, TV shows, music, and photos",
    category: "media",
    port: 32400,
    config: {
      image: "linuxserver/plex",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
        { key: "VERSION", value: "docker", description: "Plex version type" },
        { key: "PLEX_CLAIM", value: "", description: "Plex claim token from plex.tv/claim", secret: true },
      ],
      volumes: [
        { host: `${BASE_DATA}/plex/config`, container: "/config", description: "Plex configuration and database" },
        { host: `${BASE_DATA}/plex/transcode`, container: "/transcode", description: "Transcode temporary directory" },
        { host: `${MEDIA_PATH}/movies`, container: "/movies", description: "Movies library" },
        { host: `${MEDIA_PATH}/tv`, container: "/tv", description: "TV Shows library" },
        { host: `${MEDIA_PATH}/music`, container: "/music", description: "Music library" },
      ],
      dependencies: [
        { serviceId: "traefik", type: "optional", description: "Reverse proxy for remote access" },
        { serviceId: "sonarr", type: "optional", description: "TV show acquisition" },
        { serviceId: "radarr", type: "optional", description: "Movie acquisition" },
      ],
      healthCheck: { type: "http", endpoint: "/web/index.html", interval: 30, timeout: 10, retries: 3 },
    },
  },

  // ── Management ──
  {
    id: "sonarr",
    name: "Sonarr",
    description: "Smart TV series PVR – monitors, searches, and downloads episodes automatically",
    category: "management",
    port: 8989,
    config: {
      image: "linuxserver/sonarr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/sonarr/config`, container: "/config", description: "Sonarr configuration and database" },
        { host: `${MEDIA_PATH}/tv`, container: "/tv", description: "TV Shows library" },
        { host: `${MEDIA_PATH}/downloads`, container: "/downloads", description: "Download directory" },
      ],
      dependencies: [
        { serviceId: "prowlarr", type: "required", description: "Indexer management – provides search sources" },
        { serviceId: "qbittorrent", type: "optional", description: "Torrent download client" },
        { serviceId: "sabnzbd", type: "optional", description: "Usenet download client" },
        { serviceId: "nzbget", type: "optional", description: "Alternative Usenet download client" },
      ],
      healthCheck: { type: "http", endpoint: "/api/v3/system/status", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "radarr",
    name: "Radarr",
    description: "Automated movie collection manager – searches, downloads, and organizes films",
    category: "management",
    port: 7878,
    config: {
      image: "linuxserver/radarr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/radarr/config`, container: "/config", description: "Radarr configuration and database" },
        { host: `${MEDIA_PATH}/movies`, container: "/movies", description: "Movies library" },
        { host: `${MEDIA_PATH}/downloads`, container: "/downloads", description: "Download directory" },
      ],
      dependencies: [
        { serviceId: "prowlarr", type: "required", description: "Indexer management – provides search sources" },
        { serviceId: "qbittorrent", type: "optional", description: "Torrent download client" },
        { serviceId: "sabnzbd", type: "optional", description: "Usenet download client" },
        { serviceId: "nzbget", type: "optional", description: "Alternative Usenet download client" },
      ],
      healthCheck: { type: "http", endpoint: "/api/v3/system/status", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "prowlarr",
    name: "Prowlarr",
    description: "Unified indexer manager – syncs indexers to Sonarr, Radarr, and other *arr apps",
    category: "management",
    port: 9696,
    config: {
      image: "linuxserver/prowlarr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/prowlarr/config`, container: "/config", description: "Prowlarr configuration and database" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/api/v1/system/status", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "bazarr",
    name: "Bazarr",
    description: "Automated subtitle downloader companion for Sonarr and Radarr",
    category: "management",
    port: 6767,
    config: {
      image: "linuxserver/bazarr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/bazarr/config`, container: "/config", description: "Bazarr configuration" },
        { host: `${MEDIA_PATH}/movies`, container: "/movies", description: "Movies library (shared)" },
        { host: `${MEDIA_PATH}/tv`, container: "/tv", description: "TV Shows library (shared)" },
      ],
      dependencies: [
        { serviceId: "sonarr", type: "required", description: "Required for TV subtitle management" },
        { serviceId: "radarr", type: "required", description: "Required for movie subtitle management" },
      ],
      healthCheck: { type: "http", endpoint: "/api/system/status", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "seerr",
    name: "Seerr",
    description: "Media request and discovery tool – users can request movies and shows",
    category: "management",
    port: 5055,
    config: {
      image: "sctx/overseerr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "TZ", value: "America/New_York", description: "Timezone" },
        { key: "LOG_LEVEL", value: "info", description: "Logging level" },
      ],
      volumes: [
        { host: `${BASE_DATA}/seerr/config`, container: "/app/config", description: "Overseerr configuration" },
      ],
      dependencies: [
        { serviceId: "plex", type: "required", description: "Media server integration for library sync" },
        { serviceId: "sonarr", type: "required", description: "TV show request fulfillment" },
        { serviceId: "radarr", type: "required", description: "Movie request fulfillment" },
      ],
      healthCheck: { type: "http", endpoint: "/api/v1/status", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "newtarr",
    name: "Newtarr",
    description: "Newsletter and new release tracker for your media libraries",
    category: "management",
    port: 8787,
    config: {
      image: "newtarr/newtarr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/newtarr/config`, container: "/config", description: "Newtarr configuration" },
      ],
      dependencies: [
        { serviceId: "sonarr", type: "optional", description: "TV show new release tracking" },
        { serviceId: "radarr", type: "optional", description: "Movie new release tracking" },
      ],
      healthCheck: { type: "http", endpoint: "/health", interval: 60, timeout: 10, retries: 3 },
    },
  },

  // ── Download Clients ──
  {
    id: "autobrr",
    name: "Autobrr",
    description: "IRC and RSS automation – grabs releases from announce channels and feeds",
    category: "download",
    port: 7474,
    config: {
      image: "autobrr/autobrr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID" },
        { key: "PGID", value: "1000", description: "Group ID" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/autobrr/config`, container: "/config", description: "Autobrr configuration" },
      ],
      dependencies: [
        { serviceId: "qbittorrent", type: "optional", description: "Send grabbed torrents to qBittorrent" },
        { serviceId: "sonarr", type: "optional", description: "TV show filter integration" },
        { serviceId: "radarr", type: "optional", description: "Movie filter integration" },
      ],
      healthCheck: { type: "http", endpoint: "/api/healthz", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "qbittorrent",
    name: "qBittorrent",
    description: "Feature-rich BitTorrent client with web UI and extensive plugin support",
    category: "download",
    port: 8080,
    config: {
      image: "linuxserver/qbittorrent",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
        { key: "WEBUI_PORT", value: "8080", description: "Web UI port" },
        { key: "TORRENTING_PORT", value: "6881", description: "Incoming connections port" },
      ],
      volumes: [
        { host: `${BASE_DATA}/qbittorrent/config`, container: "/config", description: "qBittorrent configuration" },
        { host: `${MEDIA_PATH}/downloads/torrents`, container: "/downloads", description: "Torrent download directory" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/api/v2/app/version", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "sabnzbd",
    name: "SABnzbd",
    description: "High-performance Usenet binary newsreader with full automation support",
    category: "download",
    port: 8085,
    config: {
      image: "linuxserver/sabnzbd",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
      ],
      volumes: [
        { host: `${BASE_DATA}/sabnzbd/config`, container: "/config", description: "SABnzbd configuration" },
        { host: `${MEDIA_PATH}/downloads/usenet`, container: "/downloads", description: "Usenet download directory" },
        { host: `${MEDIA_PATH}/downloads/usenet/incomplete`, container: "/incomplete-downloads", description: "Incomplete downloads" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/api?mode=version", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "nzbget",
    name: "NZBGet",
    description: "Efficient C++ Usenet downloader with low resource usage",
    category: "download",
    port: 6789,
    config: {
      image: "linuxserver/nzbget",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "PUID", value: "1000", description: "User ID for file permissions" },
        { key: "PGID", value: "1000", description: "Group ID for file permissions" },
        { key: "TZ", value: "America/New_York", description: "Timezone" },
        { key: "NZBOP_APPENDCATEGORYDIR", value: "yes", description: "Append category to download dir" },
      ],
      volumes: [
        { host: `${BASE_DATA}/nzbget/config`, container: "/config", description: "NZBGet configuration" },
        { host: `${MEDIA_PATH}/downloads/usenet`, container: "/downloads", description: "Usenet download directory" },
      ],
      dependencies: [],
      healthCheck: { type: "http", endpoint: "/", interval: 30, timeout: 10, retries: 3 },
    },
  },
  {
    id: "unpackerr",
    name: "Unpackerr",
    description: "Automatically extracts downloaded archives for Sonarr, Radarr, and Lidarr",
    category: "download",
    port: 5656,
    config: {
      image: "golift/unpackerr",
      tag: "latest",
      network: MEDIA_NETWORK,
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "UN_SONARR_0_URL", value: "http://sonarr:8989", description: "Sonarr instance URL" },
        { key: "UN_SONARR_0_API_KEY", value: "", description: "Sonarr API key", secret: true },
        { key: "UN_RADARR_0_URL", value: "http://radarr:7878", description: "Radarr instance URL" },
        { key: "UN_RADARR_0_API_KEY", value: "", description: "Radarr API key", secret: true },
        { key: "UN_DELETE_ORIGINAL_FILE", value: "false", description: "Delete original archive after extraction" },
        { key: "UN_PARALLEL", value: "1", description: "Number of parallel extractions" },
      ],
      volumes: [
        { host: `${MEDIA_PATH}/downloads`, container: "/downloads", description: "Download directory to monitor" },
      ],
      dependencies: [
        { serviceId: "sonarr", type: "optional", description: "Monitor Sonarr downloads for extraction" },
        { serviceId: "radarr", type: "optional", description: "Monitor Radarr downloads for extraction" },
      ],
      healthCheck: { type: "tcp", interval: 60, timeout: 10, retries: 3 },
    },
  },
];

export function createServiceInstance(def: ServiceDefinition, installed: boolean, status: ServiceStatus): Service {
  const isRunning = status === "running";
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    port: def.port,
    installed,
    status,
    uptime: isRunning ? `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h` : undefined,
    cpu: isRunning ? Math.round(Math.random() * 12 * 10) / 10 : undefined,
    memory: isRunning ? Math.round(50 + Math.random() * 400) : undefined,
    healthChecks: isRunning ? Math.floor(Math.random() * 500) : 0,
    lastHealed: isRunning && Math.random() > 0.7 ? `${Math.floor(Math.random() * 48)}h ago` : undefined,
    config: { ...def.config },
    autoConfigured: false,
  };
}

export function getInstallOrder(serviceIds: string[]): string[] {
  const depGraph = new Map<string, string[]>();
  SERVICE_DEFINITIONS.forEach((def) => {
    depGraph.set(
      def.id,
      def.config.dependencies.filter((d) => d.type === "required").map((d) => d.serviceId)
    );
  });

  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) return; // cycle
    visiting.add(id);
    const deps = depGraph.get(id) || [];
    deps.forEach((dep) => {
      if (serviceIds.includes(dep)) visit(dep);
    });
    visiting.delete(id);
    visited.add(id);
    sorted.push(id);
  }

  serviceIds.forEach(visit);
  return sorted;
}

export function getDependents(serviceId: string): string[] {
  return SERVICE_DEFINITIONS.filter((def) =>
    def.config.dependencies.some((d) => d.serviceId === serviceId)
  ).map((def) => def.id);
}

export function getMissingDependencies(serviceId: string, installedIds: string[]): ServiceDependency[] {
  const def = SERVICE_DEFINITIONS.find((d) => d.id === serviceId);
  if (!def) return [];
  return def.config.dependencies.filter(
    (d) => d.type === "required" && !installedIds.includes(d.serviceId)
  );
}
