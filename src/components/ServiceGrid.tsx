import { Service, CATEGORY_ORDER, CATEGORY_LABELS, SERVICE_DEFINITIONS } from "@/lib/services";
import { ServiceCard } from "./ServiceCard";
import { Badge } from "@/components/ui/badge";

interface ServiceGridProps {
  services: Service[];
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onToggle: (id: string) => void;
  onConfigure: (id: string) => void;
}

export function ServiceGrid({ services, onInstall, onUninstall, onToggle, onConfigure }: ServiceGridProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: services.filter((s) => s.category === cat),
    count: services.filter((s) => s.category === cat && s.installed).length,
    total: services.filter((s) => s.category === cat).length,
  }));

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.category}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {group.count}/{group.total}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onInstall={() => onInstall(service.id)}
                onUninstall={() => onUninstall(service.id)}
                onToggle={() => onToggle(service.id)}
                onConfigure={() => onConfigure(service.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
