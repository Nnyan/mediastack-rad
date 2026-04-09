import yaml from "js-yaml";
import { ServiceDefinition, EnvVar, VolumeMount } from "./services";

interface ComposeService {
  image?: string;
  container_name?: string;
  environment?: Record<string, string> | string[];
  volumes?: string[];
  ports?: string[];
  depends_on?: string[] | Record<string, unknown>;
  restart?: string;
  healthcheck?: {
    test?: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
  };
  labels?: Record<string, string> | string[];
}

interface ComposeFile {
  version?: string;
  services?: Record<string, ComposeService>;
}

// Typed interface for Docker Hub API responses
interface DockerHubRawResult {
  repo_name?: string;
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  star_count?: number;
  pull_count?: number;
  is_official?: boolean;
}

function parseEnvVars(env?: Record<string, string> | string[]): EnvVar[] {
  if (!env) return [];
  if (Array.isArray(env)) {
    return env.map((e) => {
      const [key, ...rest] = e.split("=");
      const value = rest.join("=");
      return { key, value, description: `Environment variable ${key}` };
    });
  }
  return Object.entries(env).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    description: `Environment variable ${key}`,
  }));
}

function parseVolumes(vols?: string[]): VolumeMount[] {
  if (!vols) return [];
  return vols
    .filter((v) => v.includes(":"))
    .map((v) => {
      const parts = v.split(":");
      return {
        host: parts[0],
        container: parts[1],
        description: `Volume mount ${parts[0]}`,
      };
    });
}

function parsePort(ports?: string[]): number | undefined {
  if (!ports || ports.length === 0) return undefined;
  const first = ports[0];
  const match = first.match(/(\d+):\d+/);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseRestartPolicy(restart?: string): "always" | "unless-stopped" | "on-failure" {
  if (restart === "always") return "always";
  if (restart === "on-failure") return "on-failure";
  return "unless-stopped";
}

function guessCategory(name: string, image?: string): "download" | "media" | "management" | "infrastructure" {
  const lower = (name + " " + (image || "")).toLowerCase();
  if (/plex|emby|jellyfin|kodi|media.?server/.test(lower)) return "media";
  if (/torrent|nzb|sab|usenet|download|deluge|transmission|aria/.test(lower)) return "download";
  if (/traefik|nginx|caddy|cloudflare|letsencrypt|acme|wireguard|vpn|dns|pihole/.test(lower)) return "infrastructure";
  return "management";
}

export function parseComposeFile(content: string): ServiceDefinition[] {
  const parsed = yaml.load(content) as ComposeFile;
  if (!parsed?.services) {
    throw new Error("No services found in compose file");
  }

  return Object.entries(parsed.services).map(([name, svc]) => {
    const [imageName, imageTag] = (svc.image || name).split(":");
    const dependsOn = Array.isArray(svc.depends_on)
      ? svc.depends_on
      : svc.depends_on
        ? Object.keys(svc.depends_on)
        : [];

    return {
      id: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: svc.container_name || name,
      description: `Imported from docker-compose: ${imageName}`,
      category: guessCategory(name, svc.image),
      port: parsePort(svc.ports),
      config: {
        image: imageName,
        tag: imageTag || "latest",
        network: "mediastack",
        restartPolicy: parseRestartPolicy(svc.restart),
        envVars: parseEnvVars(svc.environment),
        volumes: parseVolumes(svc.volumes),
        dependencies: dependsOn.map((dep) => ({
          serviceId: dep.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          type: "optional" as const,
          description: `Depends on ${dep}`,
        })),
        healthCheck: {
          type: svc.healthcheck?.test ? "exec" as const : "http" as const,
          endpoint: "/",
          interval: 30,
          timeout: 10,
          retries: svc.healthcheck?.retries || 3,
        },
      },
    };
  });
}

export interface DockerHubResult {
  name: string;
  slug: string;
  description: string;
  star_count: number;
  pull_count: string;
  is_official: boolean;
}

export async function searchDockerHub(query: string): Promise<DockerHubResult[]> {
  const res = await fetch(
    `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=12`
  );
  if (!res.ok) throw new Error("Docker Hub search failed");
  const data = await res.json() as { results?: DockerHubRawResult[] };
  return (data.results || []).map((r: DockerHubRawResult) => ({
    name: r.repo_name || r.name || "",
    slug: r.slug || r.repo_name || r.name || "",
    description: r.short_description || r.description || "",
    star_count: r.star_count || 0,
    pull_count: formatPulls(r.pull_count || 0),
    is_official: r.is_official || false,
  }));
}

function formatPulls(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function dockerHubToDefinition(result: DockerHubResult): ServiceDefinition {
  const id = result.name.replace(/[/]/g, "-").replace(/[^a-z0-9-]/g, "").toLowerCase();
  return {
    id,
    name: result.name,
    description: result.description || `Docker image: ${result.name}`,
    category: guessCategory(result.name, result.name),
    config: {
      image: result.name,
      tag: "latest",
      network: "mediastack",
      restartPolicy: "unless-stopped",
      envVars: [
        { key: "TZ", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", description: "Timezone" },
      ],
      volumes: [],
      dependencies: [],
      healthCheck: { type: "tcp", interval: 30, timeout: 10, retries: 3 },
    },
  };
}
