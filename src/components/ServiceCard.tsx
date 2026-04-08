import { Service } from "@/lib/services";
import { StatusBadge } from "./StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Heart, Power, Trash2, Settings, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  onInstall: () => void;
  onUninstall: () => void;
  onToggle: () => void;
  onConfigure: () => void;
}

export function ServiceCard({ service, onInstall, onUninstall, onToggle, onConfigure }: ServiceCardProps) {
  const isActive = service.status === "running";
  const depCount = service.config.dependencies.length;
  const reqDeps = service.config.dependencies.filter((d) => d.type === "required").length;

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all duration-300 cursor-pointer hover:border-primary/40",
        isActive && "border-success/20 glow-primary",
        service.status === "error" && "border-destructive/30 glow-destructive",
        service.status === "healing" && "border-warning/30",
        !service.installed && "opacity-60 hover:opacity-80"
      )}
      onClick={service.installed ? onConfigure : undefined}
      style={{ animation: "slide-up 0.3s ease-out" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono font-semibold text-foreground truncate">{service.name}</h3>
            {service.port && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                :{service.port}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{service.description}</p>
        </div>
        <div className="ml-3 flex-shrink-0">
          {service.installed ? (
            <StatusBadge status={service.status} />
          ) : (
            <span className="text-xs font-mono text-muted-foreground">Not installed</span>
          )}
        </div>
      </div>

      {/* Image & network info */}
      <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
        <span className="bg-muted px-1.5 py-0.5 rounded">{service.config.image}:{service.config.tag}</span>
        {service.autoConfigured && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary h-4">
            auto-wired
          </Badge>
        )}
      </div>

      {/* Dependencies summary */}
      {depCount > 0 && (
        <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
          <Link className="w-3 h-3" />
          {reqDeps > 0 && <span className="text-warning">{reqDeps} required</span>}
          {reqDeps > 0 && depCount - reqDeps > 0 && <span>·</span>}
          {depCount - reqDeps > 0 && <span>{depCount - reqDeps} optional</span>}
        </div>
      )}

      {service.installed && service.status !== "installing" && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat icon={<Cpu className="w-3 h-3" />} label="CPU" value={service.cpu != null ? `${service.cpu}%` : "—"} />
          <Stat icon={<HardDrive className="w-3 h-3" />} label="MEM" value={service.memory != null ? `${service.memory}MB` : "—"} />
          <Stat icon={<Heart className="w-3 h-3" />} label="Checks" value={String(service.healthChecks)} />
        </div>
      )}

      {service.status === "installing" && (
        <div className="mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-info rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
          <p className="text-[10px] font-mono text-info mt-1">Pulling {service.config.image}:{service.config.tag}...</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
        {service.installed ? (
          <>
            <div className="flex items-center gap-2">
              <Power className={cn("w-3.5 h-3.5", isActive ? "text-success" : "text-muted-foreground")} />
              <Switch checked={isActive} onCheckedChange={onToggle} disabled={service.status === "installing" || service.status === "healing"} />
            </div>
            <div className="flex items-center gap-1">
              {service.lastHealed && (
                <span className="text-[10px] font-mono text-warning mr-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> {service.lastHealed}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onConfigure}>
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={onUninstall}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <Button variant="outline" size="sm" className="w-full font-mono text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={onInstall}>
            Install {service.name}
            {reqDeps > 0 && ` (+${reqDeps} deps)`}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider">{label}</p>
        <p className="text-xs font-mono font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
