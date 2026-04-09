import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useTheme } from "@/hooks/useTheme";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ServiceGrid } from "@/components/ServiceGrid";
import { ServiceConfigPanel } from "@/components/ServiceConfigPanel";
import { DependencyMap } from "@/components/DependencyMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, GitBranch } from "lucide-react";

const Index = () => {
  const { services, installService, uninstallService, toggleService, installAll, uninstallAll, updateEnvVar, addCustomServices } = useServices();
  const [configServiceId, setConfigServiceId] = useState<string | null>(null);
  const configService = configServiceId ? services.find((s) => s.id === configServiceId) || null : null;
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader services={services} onInstallAll={installAll} onUninstallAll={uninstallAll} isDark={isDark} onToggleTheme={toggleTheme} onAddServices={addCustomServices} />
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="services" className="font-mono text-xs gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Services
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="font-mono text-xs gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Dependencies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServiceGrid
              services={services}
              onInstall={installService}
              onUninstall={uninstallService}
              onToggle={toggleService}
              onConfigure={setConfigServiceId}
            />
          </TabsContent>

          <TabsContent value="dependencies">
            <DependencyMap services={services} />
          </TabsContent>
        </Tabs>
      </main>

      <ServiceConfigPanel
        service={configService}
        open={!!configServiceId}
        onClose={() => setConfigServiceId(null)}
        onEnvChange={updateEnvVar}
      />

      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          MediaStack Control • {services.filter((s) => s.status === "running").length} active •{" "}
          {services.filter((s) => s.autoConfigured).length} auto-configured
        </p>
      </footer>
    </div>
  );
};

export default Index;
