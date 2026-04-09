import { Button } from "@/components/ui/button";
import { Download, Trash2, Activity, Server, AlertTriangle, CheckCircle, Sun, Moon } from "lucide-react";
import { Service, ServiceDefinition } from "@/lib/services";
import { AddAppDialog } from "./AddAppDialog";

interface DashboardHeaderProps {
  services: Service[];
  onInstallAll: () => void;
  onUninstallAll: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onAddServices: (defs: ServiceDefinition[]) => void;
}

export function DashboardHeader({ services, onInstallAll, onUninstallAll, isDark, onToggleTheme, onAddServices }: DashboardHeaderProps) {
  const running = services.filter((s) => s.status === "running").length;
  const errors = services.filter((s) => s.status === "error" || s.status === "healing").length;
  const installed = services.filter((s) => s.installed).length;
  const autoConfigured = services.filter((s) => s.autoConfigured).length;
  const totalCpu = services.reduce((sum, s) => sum + (s.cpu || 0), 0);
  const totalMem = services.reduce((sum, s) => sum + (s.memory || 0), 0);

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
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <StatChip icon={<CheckCircle className="w-3 h-3 text-success" />} label="Running" value={running} />
              {errors > 0 && <StatChip icon={<AlertTriangle className="w-3 h-3 text-destructive" />} label="Issues" value={errors} />}
              <StatChip icon={<Server className="w-3 h-3 text-muted-foreground" />} label="Installed" value={`${installed}/${services.length}`} />
              {autoConfigured > 0 && <StatChip icon={<Activity className="w-3 h-3 text-primary" />} label="Auto-wired" value={autoConfigured} />}
              {totalCpu > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-2 py-0.5">
                  CPU: {totalCpu.toFixed(1)}% · MEM: {totalMem}MB
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onToggleTheme} title={isDark ? "Switch to light" : "Switch to dark"}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
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

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
      {icon} {label}: <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}
