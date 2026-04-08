import { ServiceStatus } from "@/lib/services";
import { cn } from "@/lib/utils";

const statusConfig: Record<ServiceStatus, { label: string; className: string; dotClass: string }> = {
  running: { label: "Running", className: "bg-success/10 text-success border-success/20", dotClass: "bg-success animate-pulse-glow" },
  stopped: { label: "Stopped", className: "bg-muted text-muted-foreground border-border", dotClass: "bg-muted-foreground" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-destructive/20", dotClass: "bg-destructive animate-pulse-glow" },
  healing: { label: "Healing", className: "bg-warning/10 text-warning border-warning/20", dotClass: "bg-warning animate-pulse-glow" },
  installing: { label: "Installing", className: "bg-info/10 text-info border-info/20", dotClass: "bg-info animate-pulse-glow" },
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border", config.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}
