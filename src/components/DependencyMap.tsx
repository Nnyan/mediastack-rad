import { Service, SERVICE_DEFINITIONS } from "@/lib/services";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DependencyMapProps {
  services: Service[];
}

export function DependencyMap({ services }: DependencyMapProps) {
  const installedIds = new Set(services.filter((s) => s.installed).map((s) => s.id));

  const edges = SERVICE_DEFINITIONS.flatMap((def) =>
    def.config.dependencies.map((dep) => ({
      from: def.id,
      to: dep.serviceId,
      type: dep.type,
      fromName: def.name,
      toName: SERVICE_DEFINITIONS.find((d) => d.id === dep.serviceId)?.name || dep.serviceId,
    }))
  );

  if (edges.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Service Dependencies
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {edges.map((edge) => {
          const fromInstalled = installedIds.has(edge.from);
          const toInstalled = installedIds.has(edge.to);
          const bothActive = fromInstalled && toInstalled;

          return (
            <div
              key={`${edge.from}-${edge.to}`}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono border",
                bothActive ? "border-success/20 bg-success/5" : "border-border bg-muted/20"
              )}
            >
              <span className={cn(fromInstalled ? "text-foreground" : "text-muted-foreground")}>{edge.fromName}</span>
              <ArrowRight className={cn("w-3 h-3 flex-shrink-0", bothActive ? "text-success" : "text-muted-foreground")} />
              <span className={cn(toInstalled ? "text-foreground" : "text-muted-foreground")}>{edge.toName}</span>
              <span className={cn("text-[9px] ml-auto", edge.type === "required" ? "text-warning" : "text-muted-foreground")}>
                {edge.type === "required" ? "req" : "opt"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
