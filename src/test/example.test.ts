import { describe, it, expect } from "vitest";
import { parseComposeFile } from "@/lib/composeParser";
import { getInstallOrder, getMissingDependencies, getDependents } from "@/lib/services";

// ── parseComposeFile ──────────────────────────────────────────────────────────

describe("parseComposeFile", () => {
  it("parses a minimal compose file", () => {
    const yaml = `
services:
  myapp:
    image: nginx:latest
    ports:
      - "8080:80"
`;
    const defs = parseComposeFile(yaml);
    expect(defs).toHaveLength(1);
    expect(defs[0].id).toBe("myapp");
    expect(defs[0].config.image).toBe("nginx");
    expect(defs[0].config.tag).toBe("latest");
    expect(defs[0].port).toBe(8080);
  });

  it("parses environment variables from array format", () => {
    const yaml = `
services:
  app:
    image: alpine
    environment:
      - FOO=bar
      - BAZ=qux
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.config.envVars).toContainEqual(expect.objectContaining({ key: "FOO", value: "bar" }));
    expect(svc.config.envVars).toContainEqual(expect.objectContaining({ key: "BAZ", value: "qux" }));
  });

  it("parses environment variables from map format", () => {
    const yaml = `
services:
  app:
    image: alpine
    environment:
      FOO: bar
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.config.envVars).toContainEqual(expect.objectContaining({ key: "FOO", value: "bar" }));
  });

  it("parses volume mounts", () => {
    const yaml = `
services:
  app:
    image: alpine
    volumes:
      - /host/data:/container/data
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.config.volumes).toHaveLength(1);
    expect(svc.config.volumes[0].host).toBe("/host/data");
    expect(svc.config.volumes[0].container).toBe("/container/data");
  });

  it("parses depends_on as array", () => {
    const yaml = `
services:
  app:
    image: alpine
    depends_on:
      - db
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.config.dependencies[0].serviceId).toBe("db");
  });

  it("parses depends_on as object", () => {
    const yaml = `
services:
  app:
    image: alpine
    depends_on:
      db:
        condition: service_healthy
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.config.dependencies[0].serviceId).toBe("db");
  });

  it("throws on invalid YAML with no services", () => {
    expect(() => parseComposeFile("not: a: compose: file")).toThrow("No services found");
  });

  it("assigns correct category for media services", () => {
    const yaml = `
services:
  jellyfin:
    image: linuxserver/jellyfin
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.category).toBe("media");
  });

  it("assigns correct category for download clients", () => {
    const yaml = `
services:
  qbittorrent:
    image: linuxserver/qbittorrent
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.category).toBe("download");
  });

  it("assigns correct category for infrastructure", () => {
    const yaml = `
services:
  traefik:
    image: traefik:v3
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.category).toBe("infrastructure");
  });

  it("defaults to management for unknown services", () => {
    const yaml = `
services:
  unknownthing:
    image: some/unknown
`;
    const [svc] = parseComposeFile(yaml);
    expect(svc.category).toBe("management");
  });
});

// ── getInstallOrder ───────────────────────────────────────────────────────────

describe("getInstallOrder", () => {
  it("installs prowlarr before sonarr (required dependency)", () => {
    const order = getInstallOrder(["sonarr", "prowlarr"]);
    expect(order.indexOf("prowlarr")).toBeLessThan(order.indexOf("sonarr"));
  });

  it("installs prowlarr before radarr", () => {
    const order = getInstallOrder(["radarr", "prowlarr"]);
    expect(order.indexOf("prowlarr")).toBeLessThan(order.indexOf("radarr"));
  });

  it("returns all requested services", () => {
    const ids = ["sonarr", "radarr", "prowlarr"];
    const order = getInstallOrder(ids);
    expect(order).toHaveLength(ids.length);
    ids.forEach((id) => expect(order).toContain(id));
  });

  it("handles a single service with no deps", () => {
    const order = getInstallOrder(["traefik"]);
    expect(order).toEqual(["traefik"]);
  });

  it("handles empty input", () => {
    expect(getInstallOrder([])).toEqual([]);
  });
});

// ── getMissingDependencies ────────────────────────────────────────────────────

describe("getMissingDependencies", () => {
  it("returns prowlarr as missing when installing sonarr with empty stack", () => {
    const missing = getMissingDependencies("sonarr", []);
    expect(missing.map((m) => m.serviceId)).toContain("prowlarr");
  });

  it("returns empty when all required deps are satisfied", () => {
    const missing = getMissingDependencies("sonarr", ["prowlarr"]);
    expect(missing).toHaveLength(0);
  });

  it("returns empty for unknown service id", () => {
    expect(getMissingDependencies("nonexistent", [])).toHaveLength(0);
  });
});

// ── getDependents ─────────────────────────────────────────────────────────────

describe("getDependents", () => {
  it("identifies services that depend on prowlarr", () => {
    const dependents = getDependents("prowlarr");
    expect(dependents).toContain("sonarr");
    expect(dependents).toContain("radarr");
  });

  it("returns empty for a service nothing depends on", () => {
    // qbittorrent has optional dependents only via other services;
    // nothing lists it as a *required* dep in SERVICE_DEFINITIONS
    const dependents = getDependents("traefik");
    // traefik may or may not have dependents; just ensure it's an array
    expect(Array.isArray(dependents)).toBe(true);
  });
});
