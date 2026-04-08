import { useState, useCallback, useEffect } from "react";
import { Service, SERVICE_DEFINITIONS, generateMockService } from "@/lib/services";
import { toast } from "@/hooks/use-toast";

export function useServices() {
  const [services, setServices] = useState<Service[]>(() =>
    SERVICE_DEFINITIONS.map(generateMockService)
  );

  // Simulate health checks
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((s) => {
          if (!s.installed || s.status === "installing") return s;
          // Small chance of status change
          if (Math.random() > 0.95) {
            const newStatus = s.status === "error" ? "healing" : s.status === "healing" ? "running" : s.status;
            if (newStatus !== s.status) {
              if (newStatus === "healing") {
                toast({ title: `🔧 Self-healing: ${s.name}`, description: "Attempting automatic recovery..." });
              } else if (newStatus === "running" && s.status === "healing") {
                toast({ title: `✅ Recovered: ${s.name}`, description: "Service restored successfully." });
              }
            }
            return {
              ...s,
              status: newStatus,
              healthChecks: s.healthChecks + 1,
              lastHealed: newStatus === "running" && s.status === "healing" ? "just now" : s.lastHealed,
            };
          }
          return { ...s, healthChecks: s.healthChecks + 1 };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const installService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, installed: true, status: "installing" as const } : s
      )
    );
    toast({ title: `📦 Installing ${id}...`, description: "Setting up container..." });
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "running", uptime: "0d 0h", cpu: 0.5, memory: 50, healthChecks: 0 } : s
        )
      );
      toast({ title: `✅ ${id} installed`, description: "Service is now running." });
    }, 2500);
  }, []);

  const uninstallService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, installed: false, status: "stopped", uptime: undefined, cpu: undefined, memory: undefined } : s
      )
    );
    toast({ title: `🗑️ ${id} uninstalled`, description: "Service removed." });
  }, []);

  const toggleService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id || !s.installed) return s;
        const newStatus = s.status === "running" ? "stopped" : "running";
        return { ...s, status: newStatus, uptime: newStatus === "running" ? "0d 0h" : undefined };
      })
    );
  }, []);

  const installAll = useCallback(() => {
    const uninstalled = services.filter((s) => !s.installed);
    uninstalled.forEach((s, i) => setTimeout(() => installService(s.id), i * 400));
  }, [services, installService]);

  const uninstallAll = useCallback(() => {
    services.filter((s) => s.installed).forEach((s) => uninstallService(s.id));
  }, [services, uninstallService]);

  return { services, installService, uninstallService, toggleService, installAll, uninstallAll };
}
