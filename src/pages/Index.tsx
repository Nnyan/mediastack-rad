import { useServices } from "@/hooks/useServices";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/services";

const Index = () => {
  const { services, installService, uninstallService, toggleService, installAll, uninstallAll } = useServices();

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: services.filter((s) => s.category === cat),
  }));

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader services={services} onInstallAll={installAll} onUninstallAll={uninstallAll} />
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {group.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onInstall={() => installService(service.id)}
                  onUninstall={() => uninstallService(service.id)}
                  onToggle={() => toggleService(service.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          MediaStack Control • Self-healing media automation • {services.filter((s) => s.status === "running").length} services active
        </p>
      </footer>
    </div>
  );
};

export default Index;
