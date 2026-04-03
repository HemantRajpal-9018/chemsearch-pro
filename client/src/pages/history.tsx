import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Clock, Trash2, RotateCcw } from "lucide-react";
import { renderSVG } from "@/lib/chemEngine";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SearchHistory } from "@shared/schema";

export default function History() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: history = [], isLoading } = useQuery<SearchHistory[]>({
    queryKey: ["/api/history"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/history/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/history"] }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({ title: "History cleared" });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Clock className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Search History</h1>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-destructive"
            onClick={() => clearMutation.mutate()}
            data-testid="button-clear-history"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Clear All
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2" data-testid="history-list">
        {history.map((entry) => {
          const svg = entry.querySmiles ? renderSVG(entry.querySmiles, 80, 60) : "";
          return (
            <Card key={entry.id} className="bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                {svg && (
                  <div className="chem-svg flex-shrink-0 bg-background/50 rounded p-1" dangerouslySetInnerHTML={{ __html: svg }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono truncate">{entry.querySmiles || entry.queryText || "—"}</code>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{entry.searchType}</Badge>
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span>{entry.resultCount} result{entry.resultCount !== 1 ? "s" : ""}</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setLocation("/")}
                    data-testid={`button-rerun-${entry.id}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => deleteMutation.mutate(entry.id)}
                    data-testid={`button-delete-history-${entry.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {history.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No search history</p>
            <p className="text-xs mt-1">Searches are saved automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
