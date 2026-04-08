export type ServiceStatus = "running" | "stopped" | "error" | "healing" | "installing";

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
}

export const SERVICE_DEFINITIONS: Omit<Service, "installed" | "status" | "uptime" | "cpu" | "memory" | "healthChecks" | "lastHealed">[] = [
  { id: "plex", name: "Plex", description: "Media server for streaming movies, TV, and music", category: "media", port: 32400 },
  { id: "sonarr", name: "Sonarr", description: "TV series collection manager and downloader", category: "management", port: 8989 },
  { id: "radarr", name: "Radarr", description: "Movie collection manager and downloader", category: "management", port: 7878 },
  { id: "prowlarr", name: "Prowlarr", description: "Indexer manager for Sonarr, Radarr, and more", category: "management", port: 9696 },
  { id: "bazarr", name: "Bazarr", description: "Subtitle manager for Sonarr and Radarr", category: "management", port: 6767 },
  { id: "seerr", name: "Seerr", description: "Media request and discovery tool", category: "management", port: 5055 },
  { id: "newtarr", name: "Newtarr", description: "Newznab indexer integration manager", category: "management", port: 8787 },
  { id: "autobrr", name: "Autobrr", description: "Automated torrent and usenet download manager", category: "download", port: 7474 },
  { id: "qbittorrent", name: "qBittorrent", description: "Feature-rich BitTorrent client", category: "download", port: 8080 },
  { id: "sabnzbd", name: "SABnzbd", description: "Binary newsreader for Usenet downloads", category: "download", port: 8085 },
  { id: "nzbget", name: "NZBGet", description: "Efficient Usenet downloader", category: "download", port: 6789 },
  { id: "unpackerr", name: "Unpackerr", description: "Extracts downloaded archives automatically", category: "download", port: 5656 },
  { id: "traefik", name: "Traefik", description: "Cloud-native reverse proxy and load balancer", category: "infrastructure", port: 8081 },
  { id: "cloudflared", name: "Cloudflared", description: "Secure tunnel to expose services via Cloudflare", category: "infrastructure" },
  { id: "letsencrypt", name: "Let's Encrypt", description: "Automated TLS certificate management", category: "infrastructure" },
  { id: "dockhand", name: "Dockhand", description: "Container orchestration and management", category: "infrastructure", port: 3100 },
];

export const CATEGORY_LABELS: Record<string, string> = {
  media: "Media Servers",
  management: "Media Management",
  download: "Download Clients",
  infrastructure: "Infrastructure",
};

export const CATEGORY_ORDER = ["media", "management", "download", "infrastructure"];

export function generateMockService(def: typeof SERVICE_DEFINITIONS[number]): Service {
  const installed = Math.random() > 0.2;
  const statuses: ServiceStatus[] = ["running", "running", "running", "stopped", "error"];
  const status = installed ? statuses[Math.floor(Math.random() * statuses.length)] : "stopped";
  return {
    ...def,
    installed,
    status,
    uptime: status === "running" ? `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h` : undefined,
    cpu: status === "running" ? Math.round(Math.random() * 15 * 10) / 10 : undefined,
    memory: status === "running" ? Math.round(Math.random() * 500) : undefined,
    healthChecks: Math.floor(Math.random() * 200),
    lastHealed: Math.random() > 0.6 ? `${Math.floor(Math.random() * 48)}h ago` : undefined,
  };
}
