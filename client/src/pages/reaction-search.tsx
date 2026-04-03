import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap, ArrowRight, Search } from "lucide-react";
import { renderSVG, isSubstructure } from "@/lib/chemEngine";
import type { Reaction } from "@shared/schema";

export default function ReactionSearch() {
  const [reactantSmiles, setReactantSmiles] = useState("");
  const [productSmiles, setProductSmiles] = useState("");
  const [results, setResults] = useState<(Reaction & { reactantSvg: string; productSvg: string })[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ["/api/reactions"],
  });

  const runSearch = () => {
    setHasSearched(true);
    const matched = reactions.filter((rxn) => {
      try {
        const matchReactant = !reactantSmiles.trim() || isSubstructure(reactantSmiles, rxn.reactantSmiles);
        const matchProduct = !productSmiles.trim() || isSubstructure(productSmiles, rxn.productSmiles);
        return matchReactant || matchProduct;
      } catch {
        return false;
      }
    }).map((rxn) => ({
      ...rxn,
      reactantSvg: renderSVG(rxn.reactantSmiles, 150, 100),
      productSvg: renderSVG(rxn.productSmiles, 150, 100),
    }));
    setResults(matched);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Zap className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Reaction Search</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="bg-card">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Reactant SMILES</label>
                <Input
                  value={reactantSmiles}
                  onChange={(e) => setReactantSmiles(e.target.value)}
                  placeholder="e.g. c1ccccc1"
                  className="font-mono text-sm"
                  data-testid="input-reactant"
                />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block" />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Product SMILES</label>
                <Input
                  value={productSmiles}
                  onChange={(e) => setProductSmiles(e.target.value)}
                  placeholder="e.g. O=[N+]([O-])c1ccccc1"
                  className="font-mono text-sm"
                  data-testid="input-product"
                />
              </div>
            </div>
            <Button onClick={runSearch} data-testid="button-reaction-search">
              <Search className="w-4 h-4 mr-2" /> Search Reactions
            </Button>
          </CardContent>
        </Card>

        {hasSearched && (
          <p className="text-xs text-muted-foreground">{results.length} reaction{results.length !== 1 ? "s" : ""} found</p>
        )}

        <div className="space-y-3" data-testid="reaction-results">
          {results.map((rxn) => (
            <Card key={rxn.id} className="bg-card hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="chem-svg bg-background/50 rounded-md p-2" dangerouslySetInnerHTML={{ __html: rxn.reactantSvg }} />
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    {rxn.conditions && <span className="text-[10px] text-muted-foreground text-center max-w-[120px]">{rxn.conditions}</span>}
                  </div>
                  <div className="chem-svg bg-background/50 rounded-md p-2" dangerouslySetInnerHTML={{ __html: rxn.productSvg }} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {rxn.reagents && <Badge variant="outline" className="text-[10px]">{rxn.reagents}</Badge>}
                  {rxn.conditions && <Badge variant="secondary" className="text-[10px]">{rxn.conditions}</Badge>}
                  <Badge variant="outline" className="text-[10px]">{rxn.source}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Search for chemical reactions</p>
            <p className="text-xs mt-1">Enter reactant and/or product SMILES</p>
          </div>
        )}
      </div>
    </div>
  );
}
