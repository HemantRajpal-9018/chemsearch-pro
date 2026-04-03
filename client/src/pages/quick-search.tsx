import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { renderSVG, getMoleculeData } from "@/lib/chemEngine";
import type { Chemical } from "@shared/schema";

export default function QuickSearch() {
  const [query, setQuery] = useState("");

  const { data: chemicals = [] } = useQuery<Chemical[]>({
    queryKey: ["/api/chemicals"],
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return chemicals
      .filter((c) => {
        return c.name.toLowerCase().includes(q) ||
          c.smiles.toLowerCase().includes(q) ||
          (c.formula || "").toLowerCase().includes(q);
      })
      .slice(0, 50)
      .map((c) => {
        const data = getMoleculeData(c.smiles);
        return {
          ...c,
          svg: renderSVG(c.smiles, 160, 120),
          computedFormula: data?.formula || c.formula || "",
          computedMw: data?.mw || c.mw || 0,
        };
      });
  }, [query, chemicals]);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return chemicals
      .filter((c) => c.name.toLowerCase().startsWith(q))
      .slice(0, 8)
      .map((c) => c.name);
  }, [query, chemicals]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Search className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Quick Search</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, formula, or SMILES..."
              className="pl-10 h-10 text-sm"
              data-testid="input-quick-search"
            />
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && query.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => setQuery(s)}
                  data-testid={`suggestion-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {query && (
          <p className="text-xs text-muted-foreground" data-testid="text-quick-result-count">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="quick-results">
          {results.map((r) => (
            <Card key={r.id} className="bg-card overflow-hidden hover:border-primary/30 transition-colors" data-testid={`quick-result-${r.id}`}>
              <CardContent className="p-3">
                <div className="chem-svg w-full flex justify-center bg-background/50 rounded-md p-2 mb-2" dangerouslySetInnerHTML={{ __html: r.svg }} />
                <h3 className="text-sm font-semibold truncate">{r.name}</h3>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{r.smiles}</p>
                <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                  {r.computedFormula && <span>{r.computedFormula}</span>}
                  {r.computedMw ? <span>MW: {r.computedMw.toFixed(1)}</span> : null}
                </div>
                <Badge variant="outline" className="text-[9px] mt-1">{r.source}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {!query && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Type to search molecules</p>
            <p className="text-xs mt-1">Search by chemical name, molecular formula, or SMILES</p>
          </div>
        )}
      </div>
    </div>
  );
}
