import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, FlaskConical, Filter, ArrowUpDown, Grid3X3, LayoutList, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StructureEditor from "@/components/structure-editor";
import { renderSVG, isSubstructure, similarity, isExactMatch, getMoleculeData } from "@/lib/chemEngine";
import type { Chemical } from "@shared/schema";

type SearchMode = "exact" | "substructure" | "similarity";
type SortMode = "relevance" | "mw" | "similarity" | "name";

interface SearchResult extends Chemical {
  matchType: SearchMode;
  similarityScore: number;
  svg: string;
  computedMw?: number;
  computedFormula?: string;
  computedLogp?: number;
  computedHbd?: number;
  computedHba?: number;
  computedTpsa?: number;
}

export default function StructureSearch() {
  const [smilesInput, setSmilesInput] = useState("");
  const [editorSmiles, setEditorSmiles] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("substructure");
  const [simThreshold, setSimThreshold] = useState(0.5);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mwMin, setMwMin] = useState("");
  const [mwMax, setMwMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const activeSmiles = smilesInput || editorSmiles;

  const { data: chemicals = [] } = useQuery<Chemical[]>({
    queryKey: ["/api/chemicals"],
  });

  const historyMutation = useMutation({
    mutationFn: async (entry: any) => {
      const res = await apiRequest("POST", "/api/history", entry);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/history"] }),
  });

  const runSearch = useCallback(() => {
    if (!activeSmiles.trim()) {
      toast({ title: "No structure", description: "Draw or enter a SMILES string first", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Run search on all chemicals
    const searchResults: SearchResult[] = [];

    for (const chem of chemicals) {
      try {
        let matched = false;
        let score = 0;
        let matchType = searchMode;

        if (searchMode === "exact") {
          matched = isExactMatch(activeSmiles, chem.smiles);
          score = matched ? 1 : 0;
        } else if (searchMode === "substructure") {
          matched = isSubstructure(activeSmiles, chem.smiles);
          score = matched ? 1 : 0;
        } else if (searchMode === "similarity") {
          score = similarity(activeSmiles, chem.smiles);
          matched = score >= simThreshold;
        }

        if (matched) {
          const data = getMoleculeData(chem.smiles);
          const svg = renderSVG(chem.smiles, 180, 130);
          searchResults.push({
            ...chem,
            matchType,
            similarityScore: score,
            svg,
            computedMw: data?.mw || chem.mw || 0,
            computedFormula: data?.formula || chem.formula || "",
            computedLogp: data?.logp ?? chem.logp ?? 0,
            computedHbd: data?.hbd ?? chem.hbd ?? 0,
            computedHba: data?.hba ?? chem.hba ?? 0,
            computedTpsa: data?.tpsa ?? chem.tpsa ?? 0,
          });
        }
      } catch { }
    }

    setResults(searchResults);
    setIsSearching(false);

    historyMutation.mutate({
      querySmiles: activeSmiles,
      queryText: "",
      searchType: searchMode,
      resultCount: searchResults.length,
    });

    toast({
      title: "Search complete",
      description: `Found ${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`,
    });
  }, [activeSmiles, searchMode, simThreshold, chemicals, toast, historyMutation]);

  const sortedResults = useMemo(() => {
    let filtered = [...results];

    // Apply MW filter
    if (mwMin) filtered = filtered.filter(r => (r.computedMw || 0) >= Number(mwMin));
    if (mwMax) filtered = filtered.filter(r => (r.computedMw || 0) <= Number(mwMax));

    // Sort
    switch (sortMode) {
      case "name": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "mw": filtered.sort((a, b) => (a.computedMw || 0) - (b.computedMw || 0)); break;
      case "similarity": filtered.sort((a, b) => b.similarityScore - a.similarityScore); break;
      default: filtered.sort((a, b) => b.similarityScore - a.similarityScore); break;
    }

    return filtered;
  }, [results, sortMode, mwMin, mwMax]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <FlaskConical className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Structure Search</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Editor + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
          <Card className="bg-card">
            <CardContent className="p-3">
              <StructureEditor onSmilesChange={setEditorSmiles} width={500} height={280} />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card className="bg-card">
              <CardContent className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">SMILES Input</label>
                  <Input
                    value={smilesInput}
                    onChange={(e) => setSmilesInput(e.target.value)}
                    placeholder="e.g. c1ccccc1"
                    className="font-mono text-sm h-8"
                    data-testid="input-smiles"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Mode</label>
                  <Select value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-search-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Exact Match</SelectItem>
                      <SelectItem value="substructure">Substructure</SelectItem>
                      <SelectItem value="similarity">Similarity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {searchMode === "similarity" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Threshold: {simThreshold.toFixed(2)}
                    </label>
                    <Slider
                      value={[simThreshold]}
                      onValueChange={([v]) => setSimThreshold(v)}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="mt-1"
                      data-testid="slider-threshold"
                    />
                  </div>
                )}

                <Button
                  onClick={runSearch}
                  disabled={isSearching || !activeSmiles}
                  className="w-full h-9"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? "Searching..." : "Search"}
                </Button>

                {activeSmiles && (
                  <div className="text-xs text-muted-foreground break-all">
                    <span className="font-medium">Active:</span> <code className="font-mono">{activeSmiles}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Controls */}
        {hasSearched && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" data-testid="text-result-count">
                  {sortedResults.length} result{sortedResults.length !== 1 ? "s" : ""}
                </span>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-3.5 h-3.5 mr-1" /> Filters
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="mw">MW</SelectItem>
                    <SelectItem value="similarity">Similarity</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                  {viewMode === "grid" ? <LayoutList className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {showFilters && (
              <Card className="bg-card">
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">MW:</span>
                    <Input value={mwMin} onChange={(e) => setMwMin(e.target.value)} placeholder="Min" className="h-7 w-20 text-xs" />
                    <span className="text-xs text-muted-foreground">-</span>
                    <Input value={mwMax} onChange={(e) => setMwMax(e.target.value)} placeholder="Max" className="h-7 w-20 text-xs" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Grid */}
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              : "space-y-2"
            } data-testid="results-container">
              {sortedResults.map((result, idx) => (
                <Card key={result.id || idx} className="bg-card overflow-hidden hover:border-primary/30 transition-colors" data-testid={`result-card-${result.id}`}>
                  <CardContent className={viewMode === "grid" ? "p-3" : "p-3 flex items-center gap-4"}>
                    <div
                      className={`chem-svg ${viewMode === "grid" ? "w-full flex justify-center bg-background/50 rounded-md p-2 mb-2" : "w-32 flex-shrink-0 bg-background/50 rounded-md p-1"}`}
                      dangerouslySetInnerHTML={{ __html: result.svg }}
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate" data-testid={`text-name-${result.id}`}>{result.name}</h3>
                        <Badge variant={result.matchType === "exact" ? "default" : "secondary"} className="text-[10px] shrink-0">
                          {result.matchType === "exact" ? "Exact" : result.matchType === "substructure" ? "Sub" : `${(result.similarityScore * 100).toFixed(0)}%`}
                        </Badge>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{result.smiles}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                        {result.computedFormula && <span>Formula: <strong>{result.computedFormula}</strong></span>}
                        {result.computedMw ? <span>MW: <strong>{result.computedMw.toFixed(1)}</strong></span> : null}
                        {result.computedLogp !== undefined ? <span>LogP: <strong>{Number(result.computedLogp).toFixed(2)}</strong></span> : null}
                        {result.computedHbd !== undefined ? <span>HBD: <strong>{result.computedHbd}</strong></span> : null}
                        {result.computedHba !== undefined ? <span>HBA: <strong>{result.computedHba}</strong></span> : null}
                        {result.computedTpsa !== undefined ? <span>TPSA: <strong>{Number(result.computedTpsa).toFixed(1)}</strong></span> : null}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px]">{result.source}</Badge>
                        {result.source === "pdf" && result.pdfId && (
                          <a
                            href={`__PORT_5000__/api/documents/${result.pdfId}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[9px] text-primary hover:underline"
                            data-testid={`link-pdf-source-${result.id}`}
                            title="Open source PDF"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span>PDF source</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sortedResults.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No results found</p>
                  <p className="text-xs mt-1">Try adjusting your search mode or similarity threshold</p>
                </div>
              )}
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Draw or enter a structure to begin</p>
            <p className="text-xs mt-1">Use the editor above or type a SMILES string</p>
          </div>
        )}
      </div>
    </div>
  );
}
