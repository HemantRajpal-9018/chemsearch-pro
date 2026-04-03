import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Undo2, Redo2, Trash2, MousePointer, Minus, Grip, Circle, RotateCcw,
  Plus, Type
} from "lucide-react";

interface Point { x: number; y: number; }

interface Atom {
  x: number; y: number;
  symbol: string;
  charge: number;
}

interface Bond {
  from: number; to: number;
  order: number; // 1, 2, 3
}

interface EditorState {
  atoms: Atom[];
  bonds: Bond[];
}

type Tool = "select" | "bond1" | "bond2" | "bond3" | "eraser" | "atom" |
  "benzene" | "cyclohexane" | "cyclopentane" | "naphthalene" | "pyridine" | "furan" | "thiophene";

const ATOM_OPTIONS = ["C", "N", "O", "S", "P", "F", "Cl", "Br", "I", "H"];

const BOND_LEN = 40;

interface StructureEditorProps {
  onSmilesChange: (smiles: string) => void;
  width?: number;
  height?: number;
}

function generateRing(cx: number, cy: number, n: number, symbols?: string[]): { atoms: Atom[]; bonds: Bond[] } {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const radius = BOND_LEN * 0.9;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    atoms.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      symbol: symbols?.[i] || "C",
      charge: 0,
    });
  }
  for (let i = 0; i < n; i++) {
    bonds.push({ from: i, to: (i + 1) % n, order: 1 });
  }
  return { atoms, bonds };
}

function generateBenzene(cx: number, cy: number) {
  const ring = generateRing(cx, cy, 6);
  // Make alternating double bonds
  ring.bonds[0].order = 2;
  ring.bonds[2].order = 2;
  ring.bonds[4].order = 2;
  return ring;
}

function generateNaphthalene(cx: number, cy: number) {
  const radius = BOND_LEN * 0.9;
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  // Two fused hexagons
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
    atoms.push({ x: cx - radius * 0.87 + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), symbol: "C", charge: 0 });
  }
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
    atoms.push({ x: cx + radius * 0.87 + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), symbol: "C", charge: 0 });
  }
  // First ring bonds
  for (let i = 0; i < 6; i++) bonds.push({ from: i, to: (i + 1) % 6, order: 1 });
  // Second ring bonds
  for (let i = 6; i < 12; i++) bonds.push({ from: i, to: i === 11 ? 6 : i + 1, order: 1 });
  bonds[0].order = 2; bonds[2].order = 2; bonds[4].order = 2;
  bonds[7].order = 2; bonds[9].order = 2; bonds[11].order = 2;
  return { atoms, bonds };
}

function generatePyridine(cx: number, cy: number) {
  const ring = generateRing(cx, cy, 6, ["N", "C", "C", "C", "C", "C"]);
  ring.bonds[0].order = 2; ring.bonds[2].order = 2; ring.bonds[4].order = 2;
  return ring;
}

function generateFuran(cx: number, cy: number) {
  const ring = generateRing(cx, cy, 5, ["O", "C", "C", "C", "C"]);
  ring.bonds[1].order = 2; ring.bonds[3].order = 2;
  return ring;
}

function generateThiophene(cx: number, cy: number) {
  const ring = generateRing(cx, cy, 5, ["S", "C", "C", "C", "C"]);
  ring.bonds[1].order = 2; ring.bonds[3].order = 2;
  return ring;
}

export default function StructureEditor({ onSmilesChange, width = 500, height = 320 }: StructureEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("bond1");
  const [atomSymbol, setAtomSymbol] = useState("C");
  const [state, setState] = useState<EditorState>({ atoms: [], bonds: [] });
  const [history, setHistory] = useState<EditorState[]>([{ atoms: [], bonds: [] }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<number | null>(null);

  const pushState = useCallback((newState: EditorState) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setState(newState);
  }, [history, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setState(history[historyIdx - 1]);
    }
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setState(history[historyIdx + 1]);
    }
  }, [history, historyIdx]);

  const clear = useCallback(() => {
    pushState({ atoms: [], bonds: [] });
  }, [pushState]);

  const findAtomAt = useCallback((x: number, y: number, threshold = 15): number | null => {
    for (let i = 0; i < state.atoms.length; i++) {
      const a = state.atoms[i];
      const d = Math.sqrt((a.x - x) ** 2 + (a.y - y) ** 2);
      if (d < threshold) return i;
    }
    return null;
  }, [state.atoms]);

  // Convert to SMILES using a simple graph traversal
  const toSMILES = useCallback((): string => {
    if (state.atoms.length === 0) return "";
    const { atoms, bonds } = state;

    // Build adjacency
    const adj: Map<number, { to: number; order: number }[]> = new Map();
    for (let i = 0; i < atoms.length; i++) adj.set(i, []);
    for (const b of bonds) {
      adj.get(b.from)!.push({ to: b.to, order: b.order });
      adj.get(b.to)!.push({ to: b.from, order: b.order });
    }

    const visited = new Set<number>();
    const visitedBonds = new Set<string>();

    function bondKey(a: number, b: number) {
      return `${Math.min(a, b)}-${Math.max(a, b)}`;
    }

    // Simple DFS SMILES generation
    function dfs(node: number): string {
      visited.add(node);
      const atom = atoms[node];
      let sym = atom.symbol;

      // Check if we need brackets
      const neighbors = adj.get(node) || [];
      const needBrackets = !["C", "N", "O", "S", "P", "F", "Cl", "Br", "I"].includes(sym) ||
        atom.charge !== 0;

      let result = needBrackets ? `[${sym}]` : (sym === "C" ? "" : sym);

      // Special case: if C has no implicit H and is simple, just use C
      if (sym === "C") result = "C";
      if (sym === "N") result = "N";
      if (sym === "O") result = "O";
      if (sym === "S") result = "S";

      const branches: string[] = [];
      let mainChain = "";

      for (const { to, order } of neighbors) {
        const bk = bondKey(node, to);
        if (visitedBonds.has(bk)) continue;
        visitedBonds.add(bk);

        if (visited.has(to)) continue;

        let bondStr = "";
        if (order === 2) bondStr = "=";
        else if (order === 3) bondStr = "#";

        const sub = dfs(to);
        if (mainChain === "") {
          mainChain = bondStr + sub;
        } else {
          branches.push(`(${bondStr}${sub})`);
        }
      }

      return result + branches.join("") + mainChain;
    }

    // Start from first atom
    return dfs(0);
  }, [state]);

  // Export SMILES whenever state changes
  useEffect(() => {
    const smiles = toSMILES();
    onSmilesChange(smiles);
  }, [state, toSMILES, onSmilesChange]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "hsl(215, 25%, 10%)" : "hsl(210, 18%, 96%)";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const bondColor = isDark ? "#e2e8f0" : "#1e293b";
    const atomColor = isDark ? "#f8fafc" : "#0f172a";
    const highlightColor = "#0ea5e9";

    // Draw bonds
    for (const bond of state.bonds) {
      const a = state.atoms[bond.from];
      const b = state.atoms[bond.to];
      if (!a || !b) continue;
      ctx.strokeStyle = bondColor;
      ctx.lineWidth = 2;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * 3;
      const ny = dx / len * 3;

      if (bond.order === 1) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (bond.order === 2) {
        ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x - nx, a.y - ny); ctx.lineTo(b.x - nx, b.y - ny); ctx.stroke();
      } else if (bond.order === 3) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x + nx * 1.5, a.y + ny * 1.5); ctx.lineTo(b.x + nx * 1.5, b.y + ny * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x - nx * 1.5, a.y - ny * 1.5); ctx.lineTo(b.x - nx * 1.5, b.y - ny * 1.5); ctx.stroke();
      }
    }

    // Draw atoms
    for (let i = 0; i < state.atoms.length; i++) {
      const a = state.atoms[i];
      const isSelected = i === selectedAtom;

      if (a.symbol !== "C" || isSelected) {
        // Draw label
        ctx.font = "bold 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (a.symbol !== "C") {
          // Background circle
          ctx.fillStyle = isDark ? "hsl(215, 25%, 10%)" : "hsl(210, 18%, 96%)";
          ctx.beginPath();
          ctx.arc(a.x, a.y, 10, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Color by element
        const elementColors: Record<string, string> = {
          C: atomColor,
          N: "#3b82f6",
          O: "#ef4444",
          S: "#eab308",
          P: "#f97316",
          F: "#22c55e",
          Cl: "#22c55e",
          Br: "#a855f7",
          I: "#8b5cf6",
          H: atomColor,
        };
        ctx.fillStyle = isSelected ? highlightColor : (elementColors[a.symbol] || atomColor);
        ctx.fillText(a.symbol, a.x, a.y);
      } else {
        // Carbon vertex - just a small dot
        ctx.fillStyle = isSelected ? highlightColor : bondColor;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw drag preview
    if (dragFrom !== null && mousePos && (tool === "bond1" || tool === "bond2" || tool === "bond3")) {
      const a = state.atoms[dragFrom];
      if (a) {
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [state, width, height, dragFrom, mousePos, selectedAtom, tool]);

  const getCanvasPos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const atomIdx = findAtomAt(pos.x, pos.y);

    if (tool === "select") {
      setSelectedAtom(atomIdx);
      return;
    }

    if (tool === "eraser") {
      if (atomIdx !== null) {
        const newAtoms = [...state.atoms];
        const newBonds = state.bonds.filter(b => b.from !== atomIdx && b.to !== atomIdx);
        // Reindex bonds
        const reindexed = newBonds.map(b => ({
          ...b,
          from: b.from > atomIdx ? b.from - 1 : b.from,
          to: b.to > atomIdx ? b.to - 1 : b.to,
        }));
        newAtoms.splice(atomIdx, 1);
        pushState({ atoms: newAtoms, bonds: reindexed });
      }
      return;
    }

    if (tool === "atom") {
      if (atomIdx !== null) {
        // Change atom symbol
        const newAtoms = [...state.atoms];
        newAtoms[atomIdx] = { ...newAtoms[atomIdx], symbol: atomSymbol };
        pushState({ atoms: newAtoms, bonds: [...state.bonds] });
      } else {
        // Place new atom
        pushState({
          atoms: [...state.atoms, { x: pos.x, y: pos.y, symbol: atomSymbol, charge: 0 }],
          bonds: [...state.bonds],
        });
      }
      return;
    }

    if (tool === "bond1" || tool === "bond2" || tool === "bond3") {
      if (atomIdx !== null) {
        setDragFrom(atomIdx);
      } else {
        // Create atom and start drag
        const newAtoms = [...state.atoms, { x: pos.x, y: pos.y, symbol: "C", charge: 0 }];
        setState({ atoms: newAtoms, bonds: [...state.bonds] });
        setDragFrom(newAtoms.length - 1);
      }
      return;
    }

    // Template tools
    if (["benzene", "cyclohexane", "cyclopentane", "naphthalene", "pyridine", "furan", "thiophene"].includes(tool)) {
      let template: { atoms: Atom[]; bonds: Bond[] };
      switch (tool) {
        case "benzene": template = generateBenzene(pos.x, pos.y); break;
        case "cyclohexane": template = generateRing(pos.x, pos.y, 6); break;
        case "cyclopentane": template = generateRing(pos.x, pos.y, 5); break;
        case "naphthalene": template = generateNaphthalene(pos.x, pos.y); break;
        case "pyridine": template = generatePyridine(pos.x, pos.y); break;
        case "furan": template = generateFuran(pos.x, pos.y); break;
        case "thiophene": template = generateThiophene(pos.x, pos.y); break;
        default: return;
      }
      const offset = state.atoms.length;
      const newAtoms = [...state.atoms, ...template.atoms];
      const newBonds = [...state.bonds, ...template.bonds.map(b => ({ ...b, from: b.from + offset, to: b.to + offset }))];
      pushState({ atoms: newAtoms, bonds: newBonds });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragFrom !== null) {
      setMousePos(getCanvasPos(e));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragFrom === null) return;
    const pos = getCanvasPos(e);
    const atomIdx = findAtomAt(pos.x, pos.y);
    const order = tool === "bond3" ? 3 : tool === "bond2" ? 2 : 1;

    if (atomIdx !== null && atomIdx !== dragFrom) {
      // Check if bond already exists
      const existing = state.bonds.findIndex(b =>
        (b.from === dragFrom && b.to === atomIdx) || (b.from === atomIdx && b.to === dragFrom)
      );
      if (existing >= 0) {
        // Cycle bond order
        const newBonds = [...state.bonds];
        newBonds[existing] = { ...newBonds[existing], order: (newBonds[existing].order % 3) + 1 };
        pushState({ atoms: [...state.atoms], bonds: newBonds });
      } else {
        pushState({
          atoms: [...state.atoms],
          bonds: [...state.bonds, { from: dragFrom, to: atomIdx, order }],
        });
      }
    } else if (atomIdx === null) {
      // Create new atom and bond
      const dist = Math.sqrt((pos.x - state.atoms[dragFrom].x) ** 2 + (pos.y - state.atoms[dragFrom].y) ** 2);
      if (dist > 10) {
        const newAtoms = [...state.atoms, { x: pos.x, y: pos.y, symbol: "C", charge: 0 }];
        pushState({
          atoms: newAtoms,
          bonds: [...state.bonds, { from: dragFrom, to: newAtoms.length - 1, order }],
        });
      }
    }

    setDragFrom(null);
    setMousePos(null);
  };

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: "Select", icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: "bond1", label: "Single Bond", icon: <Minus className="w-3.5 h-3.5" /> },
    { id: "bond2", label: "Double Bond", icon: <span className="text-[10px] font-bold">=</span> },
    { id: "bond3", label: "Triple Bond", icon: <span className="text-[10px] font-bold">≡</span> },
    { id: "atom", label: "Atom", icon: <Type className="w-3.5 h-3.5" /> },
    { id: "eraser", label: "Eraser", icon: <Trash2 className="w-3.5 h-3.5" /> },
  ];

  const templates: { id: Tool; label: string }[] = [
    { id: "benzene", label: "⌬ Benzene" },
    { id: "cyclohexane", label: "⬡ Cyclohex" },
    { id: "cyclopentane", label: "⬠ Cyclopent" },
    { id: "pyridine", label: "Py" },
    { id: "furan", label: "Fu" },
    { id: "thiophene", label: "Th" },
    { id: "naphthalene", label: "Naph" },
  ];

  return (
    <div className="flex flex-col gap-1.5" data-testid="structure-editor">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {tools.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === t.id ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setTool(t.id)}
                data-testid={`tool-${t.id}`}
              >
                {t.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><span className="text-xs">{t.label}</span></TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {tool === "atom" && (
          <div className="flex gap-0.5">
            {ATOM_OPTIONS.map((sym) => (
              <Button
                key={sym}
                variant={atomSymbol === sym ? "default" : "ghost"}
                size="sm"
                className="h-7 px-1.5 text-xs font-mono"
                onClick={() => setAtomSymbol(sym)}
              >
                {sym}
              </Button>
            ))}
          </div>
        )}

        {tool !== "atom" && templates.map((t) => (
          <Button
            key={t.id}
            variant={tool === t.id ? "default" : "ghost"}
            size="sm"
            className="h-7 px-1.5 text-[10px]"
            onClick={() => setTool(t.id)}
            data-testid={`template-${t.id}`}
          >
            {t.label}
          </Button>
        ))}

        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={undo} disabled={historyIdx <= 0} data-testid="button-undo">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={redo} disabled={historyIdx >= history.length - 1} data-testid="button-redo">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clear} data-testid="button-clear">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="border border-border rounded-lg chem-editor-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setDragFrom(null); setMousePos(null); }}
        data-testid="editor-canvas"
      />
    </div>
  );
}
