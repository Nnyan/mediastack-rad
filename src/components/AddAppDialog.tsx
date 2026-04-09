import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, Star, Download, Loader2, AlertCircle, Package } from "lucide-react";
import { parseComposeFile, searchDockerHub, dockerHubToDefinition, DockerHubResult } from "@/lib/composeParser";
import { ServiceDefinition } from "@/lib/services";
import { toast } from "@/hooks/use-toast";

interface AddAppDialogProps {
  existingIds: string[];
  onAddServices: (defs: ServiceDefinition[]) => void;
}

export function AddAppDialog({ existingIds, onAddServices }: AddAppDialogProps) {
  const [open, setOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedServices, setParsedServices] = useState<ServiceDefinition[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DockerHubResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleParse = useCallback(() => {
    setParseError(null);
    setParsedServices([]);
    try {
      const defs = parseComposeFile(composeText);
      const filtered = defs.filter((d) => !existingIds.includes(d.id));
      if (filtered.length === 0) {
        setParseError("All services in this compose file already exist.");
        return;
      }
      setParsedServices(filtered);
    } catch (e: any) {
      setParseError(e.message || "Failed to parse compose file");
    }
  }, [composeText, existingIds]);

  const handleImportCompose = useCallback(() => {
    onAddServices(parsedServices);
    toast({ title: `📦 Imported ${parsedServices.length} service(s)` });
    setParsedServices([]);
    setComposeText("");
    setOpen(false);
  }, [parsedServices, onAddServices]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const res = await searchDockerHub(searchQuery);
      setResults(res);
      if (res.length === 0) setSearchError("No results found");
    } catch (e: any) {
      setSearchError(e.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleAddFromHub = useCallback(
    (result: DockerHubResult) => {
      const def = dockerHubToDefinition(result);
      if (existingIds.includes(def.id)) {
        toast({ title: "⚠️ Already exists", description: `${def.name} is already in your stack.`, variant: "destructive" });
        return;
      }
      onAddServices([def]);
      toast({ title: `📦 Added ${def.name}` });
    },
    [existingIds, onAddServices]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setComposeText(ev.target?.result as string);
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Application
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="compose" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="compose" className="flex-1 font-mono text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Docker Compose
            </TabsTrigger>
            <TabsTrigger value="hub" className="flex-1 font-mono text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" /> Docker Hub
            </TabsTrigger>
          </TabsList>

          {/* ── Compose Tab ── */}
          <TabsContent value="compose" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept=".yml,.yaml" className="hidden" onChange={handleFileUpload} />
                <Badge variant="secondary" className="cursor-pointer font-mono text-xs px-3 py-1.5 hover:bg-secondary/80">
                  <FileText className="w-3 h-3 mr-1.5" /> Upload File
                </Badge>
              </label>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder={`version: "3"\nservices:\n  myapp:\n    image: myimage:latest\n    ports:\n      - "8080:80"\n    environment:\n      - KEY=value`}
              className="font-mono text-xs min-h-[200px]"
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
            />
            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-xs font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {parseError}
              </div>
            )}
            {parsedServices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground">Found {parsedServices.length} new service(s):</p>
                <div className="grid gap-2">
                  {parsedServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.config.image}:{s.config.tag}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">{s.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {parsedServices.length === 0 ? (
                <Button onClick={handleParse} disabled={!composeText.trim()} size="sm" className="font-mono text-xs">
                  Parse Compose File
                </Button>
              ) : (
                <Button onClick={handleImportCompose} size="sm" className="font-mono text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Import {parsedServices.length} Service(s)
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ── Docker Hub Tab ── */}
          <TabsContent value="hub" className="space-y-4 mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Search Docker Hub (e.g. jellyfin, nginx, pihole)"
                className="font-mono text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={searching || !searchQuery.trim()} className="font-mono text-xs shrink-0">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </Button>
            </form>

            {searchError && (
              <div className="flex items-center gap-2 text-destructive text-xs font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchError}
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                {results.map((r) => {
                  const alreadyExists = existingIds.includes(
                    r.name.replace(/[/]/g, "-").replace(/[^a-z0-9-]/g, "").toLowerCase()
                  );
                  return (
                    <div
                      key={r.name}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          {r.is_official && (
                            <Badge variant="default" className="text-[9px] font-mono px-1.5 py-0">Official</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3" /> {r.star_count}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Download className="w-3 h-3" /> {r.pull_count}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyExists ? "secondary" : "outline"}
                        className="font-mono text-xs shrink-0"
                        disabled={alreadyExists}
                        onClick={() => handleAddFromHub(r)}
                      >
                        {alreadyExists ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
