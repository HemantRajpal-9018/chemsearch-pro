import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Columns2, ArrowRight } from "lucide-react";
import { renderSVG, getMoleculeData, type MoleculeData } from "@/lib/chemEngine";

export default function Compare() {
  const [smiles1, setSmiles1] = useState("");
  const [smiles2, setSmiles2] = useState("");
  const [mol1, setMol1] = useState<MoleculeData | null>(null);
  const [mol2, setMol2] = useState<MoleculeData | null>(null);
  const [svg1, setSvg1] = useState("");
  const [svg2, setSvg2] = useState("");

  const compare = () => {
    if (smiles1.trim()) {
      setMol1(getMoleculeData(smiles1));
      setSvg1(renderSVG(smiles1, 220, 160));
    }
    if (smiles2.trim()) {
      setMol2(getMoleculeData(smiles2));
      setSvg2(renderSVG(smiles2, 220, 160));
    }
  };

  const props = [
    { label: "SMILES", v1: mol1?.canonicalSmiles, v2: mol2?.canonicalSmiles },
    { label: "Formula", v1: mol1?.formula, v2: mol2?.formula },
    { label: "Mol. Weight", v1: mol1?.mw?.toFixed(2), v2: mol2?.mw?.toFixed(2) },
    { label: "LogP", v1: mol1?.logp?.toFixed(2), v2: mol2?.logp?.toFixed(2) },
    { label: "HBD", v1: mol1?.hbd?.toString(), v2: mol2?.hbd?.toString() },
    { label: "HBA", v1: mol1?.hba?.toString(), v2: mol2?.hba?.toString() },
    { label: "TPSA", v1: mol1?.tpsa?.toFixed(1), v2: mol2?.tpsa?.toFixed(1) },
    { label: "Rotatable Bonds", v1: mol1?.rotatableBonds?.toString(), v2: mol2?.rotatableBonds?.toString() },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Columns2 className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Compare Structures</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Molecule A</label>
                <Input
                  value={smiles1}
                  onChange={(e) => setSmiles1(e.target.value)}
                  placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
                  className="font-mono text-sm"
                  data-testid="input-compare-1"
                />
              </div>
              <span className="text-muted-foreground text-sm hidden md:block">vs</span>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Molecule B</label>
                <Input
                  value={smiles2}
                  onChange={(e) => setSmiles2(e.target.value)}
                  placeholder="e.g. CC(C)Cc1ccc(cc1)C(C)C(=O)O"
                  className="font-mono text-sm"
                  data-testid="input-compare-2"
                />
              </div>
            </div>
            <Button onClick={compare} data-testid="button-compare">
              <Columns2 className="w-4 h-4 mr-2" /> Compare
            </Button>
          </CardContent>
        </Card>

        {(mol1 || mol2) && (
          <>
            {/* Structure comparison */}
            <div className="grid grid-cols-2 gap-4">
              {svg1 && (
                <Card className="bg-card">
                  <CardContent className="p-3 flex justify-center">
                    <div className="chem-svg" dangerouslySetInnerHTML={{ __html: svg1 }} />
                  </CardContent>
                </Card>
              )}
              {svg2 && (
                <Card className="bg-card">
                  <CardContent className="p-3 flex justify-center">
                    <div className="chem-svg" dangerouslySetInnerHTML={{ __html: svg2 }} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Property comparison table */}
            <Card className="bg-card">
              <CardContent className="p-0 overflow-hidden">
                <table className="w-full text-sm" data-testid="compare-table">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Property</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Molecule A</th>
                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Molecule B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.filter((p) => p.v1 || p.v2).map((p) => (
                      <tr key={p.label} className="border-b last:border-0">
                        <td className="p-2 text-xs font-medium">{p.label}</td>
                        <td className="p-2 text-xs font-mono">{p.v1 || "—"}</td>
                        <td className="p-2 text-xs font-mono">{p.v2 || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}

        {!mol1 && !mol2 && (
          <div className="text-center py-16 text-muted-foreground">
            <Columns2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Compare two molecules</p>
            <p className="text-xs mt-1">Enter SMILES for both structures to compare properties</p>
          </div>
        )}
      </div>
    </div>
  );
}
