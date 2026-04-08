import { Button } from "@/components/ui/button";
import { Download, Trash2, Activity } from "lucide-react";
import { Service } from "@/lib/services";

interface DashboardHeaderProps {
  services: Service[];
  onInstallAll: () => void;
  onUninstallAll: () => void;
}

export function DashboardHeader({ services, onInstallAll, onUninstallAll }: DashboardHeaderProps) {
  const running = services.filter((s) => s.status === "running").length;
  const errors = services.filter((s) => s.status === "error").length;
  const installed = services.filter((s) => s.installed).length;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-mono font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-glow-primary">MediaStack</span>
              <span className="text-muted-foreground font-normal">Control</span>
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <StatPill label="Running" value={running} color="text-success" />
              <StatPill label="Errors" value={errors} color="text-destructive" />
              <StatPill label="Installed" value={`${installed}/${services.length}`} color="text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={onInstallAll}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Install All
            </Button>
            <Button variant="outline" size="sm" className="font-mono text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onUninstallAll}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Uninstall All
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <span className="text-xs font-mono text-muted-foreground">
      {label}: <span className={`font-semibold ${color}`}>{value}</span>
    </span>
  );
}
