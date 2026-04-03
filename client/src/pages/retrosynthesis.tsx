import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GitBranch, ArrowDown, Search } from "lucide-react";
import { renderSVG, getRetrosynthesis, type RetroStep } from "@/lib/chemEngine";

export default function Retrosynthesis() {
  const [targetSmiles, setTargetSmiles] = useState("");
  const [steps, setSteps] = useState<RetroStep[]>([]);
  const [targetSvg, setTargetSvg] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const analyze = () => {
    if (!targetSmiles.trim()) return;
    const svg = renderSVG(targetSmiles, 200, 140);
    setTargetSvg(svg);
    const retroSteps = getRetrosynthesis(targetSmiles);
    setSteps(retroSteps);
    setHasSearched(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <GitBranch className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Retrosynthesis Planner</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="bg-card">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Molecule (SMILES)</label>
              <div className="flex gap-2">
                <Input
                  value={targetSmiles}
                  onChange={(e) => setTargetSmiles(e.target.value)}
                  placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
                  className="font-mono text-sm flex-1"
                  data-testid="input-retro-target"
                />
                <Button onClick={analyze} data-testid="button-analyze-retro">
                  <Search className="w-4 h-4 mr-2" /> Analyze
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && targetSvg && (
          <div className="space-y-4">
            {/* Target */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-muted-foreground mb-2">Target</div>
              <Card className="bg-card inline-block">
                <CardContent className="p-3">
                  <div className="chem-svg" dangerouslySetInnerHTML={{ __html: targetSvg }} />
                </CardContent>
              </Card>
            </div>

            {/* Retrosynthesis steps */}
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <ArrowDown className="w-5 h-5 text-primary" />
                <Card className="bg-card w-full max-w-lg">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{step.disconnection}</h3>
                      <Badge variant="secondary" className="text-[10px]">{step.reaction}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{step.conditions}</div>
                    <div className="space-y-1 mt-2">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Precursors</div>
                      {step.precursors.map((p, pi) => (
                        <div key={pi} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm">{p}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No disconnections found for this structure</p>
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Plan synthetic routes</p>
            <p className="text-xs mt-1">Enter a target SMILES to find possible disconnections</p>
          </div>
        )}
      </div>
    </div>
  );
}
