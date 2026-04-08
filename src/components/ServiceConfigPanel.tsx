import { Service } from "@/lib/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Lock, Folder, Link, HeartPulse, Container } from "lucide-react";

interface ServiceConfigPanelProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onEnvChange: (serviceId: string, key: string, value: string) => void;
}

export function ServiceConfigPanel({ service, open, onClose, onEnvChange }: ServiceConfigPanelProps) {
  if (!service) return null;
  const { config } = service;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-3">
            <Container className="w-5 h-5 text-primary" />
            {service.name}
            <StatusBadge status={service.status} />
            {service.autoConfigured && (
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Auto-configured
              </Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </DialogHeader>

        <div className="text-xs font-mono text-muted-foreground flex items-center gap-4 py-2 border-y border-border">
          <span>Image: <span className="text-foreground">{config.image}:{config.tag}</span></span>
          <span>Network: <span className="text-foreground">{config.network}</span></span>
          <span>Restart: <span className="text-foreground">{config.restartPolicy}</span></span>
        </div>

        <Tabs defaultValue="env" className="mt-2">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="env" className="font-mono text-xs">Environment</TabsTrigger>
            <TabsTrigger value="volumes" className="font-mono text-xs">Volumes</TabsTrigger>
            <TabsTrigger value="deps" className="font-mono text-xs">Dependencies</TabsTrigger>
            <TabsTrigger value="health" className="font-mono text-xs">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="env" className="space-y-3 mt-3">
            {config.envVars.map((env) => (
              <div key={env.key} className="space-y-1">
                <Label className="text-xs font-mono flex items-center gap-1.5">
                  {env.secret && <Lock className="w-3 h-3 text-warning" />}
                  {env.key}
                </Label>
                <Input
                  className="font-mono text-xs bg-muted/50 border-border h-8"
                  type={env.secret ? "password" : "text"}
                  value={env.value}
                  placeholder={env.description}
                  onChange={(e) => onEnvChange(service.id, env.key, e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">{env.description}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="volumes" className="mt-3">
            <div className="space-y-2">
              {config.volumes.map((vol) => (
                <div key={vol.container} className="flex items-start gap-2 p-2 rounded bg-muted/30 border border-border">
                  <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-mono">
                      <span className="text-foreground">{vol.host}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-primary">{vol.container}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{vol.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deps" className="mt-3">
            {config.dependencies.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono py-4 text-center">No dependencies – standalone service</p>
            ) : (
              <div className="space-y-2">
                {config.dependencies.map((dep) => (
                  <div key={dep.serviceId} className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border">
                    <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-xs font-mono flex items-center gap-2">
                        <span className="text-foreground">{dep.serviceId}</span>
                        <Badge variant={dep.type === "required" ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0">
                          {dep.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{dep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="health" className="mt-3">
            <div className="p-3 rounded bg-muted/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-medium text-foreground">Health Check Configuration</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground">{config.healthCheck.type}</span></div>
                {config.healthCheck.endpoint && (
                  <div><span className="text-muted-foreground">Endpoint:</span> <span className="text-primary">{config.healthCheck.endpoint}</span></div>
                )}
                <div><span className="text-muted-foreground">Interval:</span> <span className="text-foreground">{config.healthCheck.interval}s</span></div>
                <div><span className="text-muted-foreground">Timeout:</span> <span className="text-foreground">{config.healthCheck.timeout}s</span></div>
                <div><span className="text-muted-foreground">Retries:</span> <span className="text-foreground">{config.healthCheck.retries}</span></div>
              </div>
              {service.installed && (
                <div className="pt-2 border-t border-border text-xs font-mono">
                  <span className="text-muted-foreground">Total checks: </span>
                  <span className="text-success">{service.healthChecks}</span>
                  {service.lastHealed && (
                    <span className="ml-3 text-warning">Last healed: {service.lastHealed}</span>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
