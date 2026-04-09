import { useState, useCallback, useEffect, useRef } from "react";
import {
  Service,
  ServiceStatus,
  ServiceDefinition,
  SERVICE_DEFINITIONS,
  createServiceInstance,
  getInstallOrder,
  getMissingDependencies,
  getDependents,
} from "@/lib/services";
import { toast } from "@/hooks/use-toast";

export function useServices() {
  const [services, setServices] = useState<Service[]>(() =>
    SERVICE_DEFINITIONS.map((def) => createServiceInstance(def, false, "stopped"))
  );
  const healingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Health check simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          if (!s.installed || s.status === "installing" || s.status === "stopped") return s;
          // Increment health checks
          const updated = { ...s, healthChecks: s.healthChecks + 1 };
          // Small chance of error for running services
          if (s.status === "running" && Math.random() > 0.985) {
            toast({
              title: `⚠️ ${s.name} health check failed`,
              description: "Initiating self-healing...",
              variant: "destructive",
            });
            // Schedule auto-heal
            const timer = setTimeout(() => {
              setServices((cur) =>
                cur.map((cs) =>
                  cs.id === s.id && cs.status === "healing"
                    ? { ...cs, status: "running" as ServiceStatus, lastHealed: "just now", healthChecks: cs.healthChecks + 1 }
                    : cs
                )
              );
              toast({ title: `✅ ${s.name} recovered`, description: "Self-healing completed successfully." });
            }, 3000 + Math.random() * 4000);
            healingTimers.current.set(s.id, timer);
            return { ...updated, status: "healing" as ServiceStatus };
          }
          return updated;
        })
      );
    }, 5000);
    return () => {
      clearInterval(interval);
      healingTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const installService = useCallback((id: string) => {
    setServices((prev) => {
      const installedIds = prev.filter((s) => s.installed).map((s) => s.id);
      const missing = getMissingDependencies(id, installedIds);
      if (missing.length > 0) {
        // Auto-install required dependencies
        const allToInstall = getInstallOrder([id, ...missing.map((m) => m.serviceId)]);
        toast({
          title: `📦 Installing ${id} with dependencies`,
          description: `Also installing: ${missing.map((m) => m.serviceId).join(", ")}`,
        });
        return prev.map((s) => {
          if (allToInstall.includes(s.id) && !s.installed) {
            return { ...s, installed: true, status: "installing" as ServiceStatus };
          }
          return s;
        });
      }
      return prev.map((s) => (s.id === id ? { ...s, installed: true, status: "installing" as ServiceStatus } : s));
    });

    toast({ title: `📦 Installing ${SERVICE_DEFINITIONS.find((d) => d.id === id)?.name}...` });

    // Simulate install
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.status === "installing"
            ? {
                ...s,
                status: "running" as ServiceStatus,
                uptime: "0d 0h",
                cpu: Math.round(Math.random() * 5 * 10) / 10,
                memory: Math.round(30 + Math.random() * 100),
                healthChecks: 0,
                autoConfigured: true,
              }
            : s
        )
      );
      toast({ title: `✅ Service(s) installed and auto-configured` });
    }, 2500);
  }, []);

  const uninstallService = useCallback((id: string) => {
    setServices((prev) => {
      const dependents = getDependents(id).filter((depId) => {
        const svc = prev.find((s) => s.id === depId);
        return svc?.installed;
      });
      if (dependents.length > 0) {
        toast({
          title: `⚠️ Cannot uninstall ${id}`,
          description: `Required by: ${dependents.join(", ")}. Uninstall dependents first.`,
          variant: "destructive",
        });
        return prev;
      }
      toast({ title: `🗑️ ${id} uninstalled` });
      return prev.map((s) =>
        s.id === id
          ? { ...s, installed: false, status: "stopped" as ServiceStatus, uptime: undefined, cpu: undefined, memory: undefined, autoConfigured: false }
          : s
      );
    });
  }, []);

  const toggleService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id || !s.installed || s.status === "installing" || s.status === "healing") return s;
        const newStatus: ServiceStatus = s.status === "running" ? "stopped" : "running";
        return {
          ...s,
          status: newStatus,
          uptime: newStatus === "running" ? "0d 0h" : undefined,
          cpu: newStatus === "running" ? 0.5 : undefined,
          memory: newStatus === "running" ? 50 : undefined,
        };
      })
    );
  }, []);

  const installAll = useCallback(() => {
    const allIds = SERVICE_DEFINITIONS.map((d) => d.id);
    const ordered = getInstallOrder(allIds);
    toast({ title: "📦 Installing entire stack...", description: `${ordered.length} services in dependency order` });
    setServices((prev) =>
      prev.map((s) => (!s.installed ? { ...s, installed: true, status: "installing" as ServiceStatus } : s))
    );
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.status === "installing"
            ? {
                ...s,
                status: "running" as ServiceStatus,
                uptime: "0d 0h",
                cpu: Math.round(Math.random() * 8 * 10) / 10,
                memory: Math.round(50 + Math.random() * 300),
                healthChecks: 0,
                autoConfigured: true,
              }
            : s
        )
      );
      toast({ title: "✅ Full stack deployed!", description: "All services running and auto-configured." });
    }, 3500);
  }, []);

  const uninstallAll = useCallback(() => {
    toast({ title: "🗑️ Uninstalling all services..." });
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        installed: false,
        status: "stopped" as ServiceStatus,
        uptime: undefined,
        cpu: undefined,
        memory: undefined,
        autoConfigured: false,
      }))
    );
  }, []);

  const updateEnvVar = useCallback((serviceId: string, key: string, value: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              config: {
                ...s.config,
                envVars: s.config.envVars.map((e) => (e.key === key ? { ...e, value } : e)),
              },
            }
          : s
      )
    );
  }, []);

  const addCustomServices = useCallback((defs: ServiceDefinition[]) => {
    setServices((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newServices = defs
        .filter((d) => !existingIds.has(d.id))
        .map((d) => createServiceInstance(d, false, "stopped"));
      return [...prev, ...newServices];
    });
  }, []);

  return { services, installService, uninstallService, toggleService, installAll, uninstallAll, updateEnvVar, addCustomServices };
}
