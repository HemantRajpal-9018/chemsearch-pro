import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { List, Play, Download } from "lucide-react";
import { isSubstructure, similarity, getMoleculeData, renderSVG } from "@/lib/chemEngine";
import { useToast } from "@/hooks/use-toast";
import type { Chemical } from "@shared/schema";

interface BatchResult {
  querySmiles: string;
  matches: {
    name: string;
    smiles: string;
    similarity: number;
    svg: string;
  }[];
}

export default function BatchSearch() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: chemicals = [] } = useQuery<Chemical[]>({
    queryKey: ["/api/chemicals"],
  });

  const runBatch = () => {
    const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast({ title: "No SMILES", description: "Enter at least one SMILES string", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    const batchResults: BatchResult[] = [];

    for (const smiles of lines) {
      const matches: BatchResult["matches"] = [];
      for (const chem of chemicals) {
        try {
          if (isSubstructure(smiles, chem.smiles)) {
            const sim = similarity(smiles, chem.smiles);
            matches.push({
              name: chem.name,
              smiles: chem.smiles,
              similarity: sim,
              svg: renderSVG(chem.smiles, 120, 90),
            });
          }
        } catch { }
      }
      batchResults.push({ querySmiles: smiles, matches: matches.slice(0, 10) });
    }

    setResults(batchResults);
    setIsSearching(false);
    toast({ title: "Batch search complete", description: `Processed ${lines.length} queries` });
  };

  const exportCSV = () => {
    let csv = "Query SMILES,Match Name,Match SMILES,Similarity\n";
    for (const r of results) {
      for (const m of r.matches) {
        csv += `"${r.querySmiles}","${m.name}","${m.smiles}",${m.similarity.toFixed(4)}\n`;
      }
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "batch_results.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <List className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Batch Search</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">SMILES (one per line)</label>
              <label className="cursor-pointer">
                <Badge variant="outline" className="text-[10px] cursor-pointer">Upload .txt file</Badge>
                <input type="file" accept=".txt,.smi,.smiles" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"c1ccccc1\nCc1ccccc1\nOc1ccccc1"}
              className="font-mono text-sm min-h-[120px]"
              data-testid="input-batch"
            />
            <div className="flex gap-2">
              <Button onClick={runBatch} disabled={isSearching} data-testid="button-batch-search">
                <Play className="w-4 h-4 mr-2" /> {isSearching ? "Searching..." : "Run Batch"}
              </Button>
              {results.length > 0 && (
                <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-3" data-testid="batch-results">
          {results.map((r, idx) => (
            <Card key={idx} className="bg-card">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Query:</span>
                  <code className="text-xs font-mono text-muted-foreground">{r.querySmiles}</code>
                  <Badge variant="secondary" className="text-[10px]">{r.matches.length} match{r.matches.length !== 1 ? "es" : ""}</Badge>
                </div>
                {r.matches.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {r.matches.map((m, mi) => (
                      <div key={mi} className="flex-shrink-0 bg-background/50 rounded-md p-2 text-center">
                        <div className="chem-svg" dangerouslySetInnerHTML={{ __html: m.svg }} />
                        <div className="text-[10px] font-medium mt-1 truncate max-w-[120px]">{m.name}</div>
                        <div className="text-[9px] text-muted-foreground">{(m.similarity * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Run searches on multiple structures</p>
            <p className="text-xs mt-1">Enter multiple SMILES strings, one per line</p>
          </div>
        )}
      </div>
    </div>
  );
}
