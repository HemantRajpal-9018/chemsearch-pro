import OCL from "openchemlib";

const { Molecule, SSSearcher, SSSearcherWithIndex, MoleculeProperties } = OCL;

export interface MoleculeData {
  smiles: string;
  canonicalSmiles: string;
  formula: string;
  mw: number;
  logp: number;
  hbd: number;
  hba: number;
  tpsa: number;
  rotatableBonds: number;
  svg: string;
}

export function parseSMILES(smiles: string): typeof Molecule.prototype | null {
  try {
    return Molecule.fromSmiles(smiles);
  } catch {
    return null;
  }
}

export function getMoleculeData(smiles: string, svgWidth = 200, svgHeight = 150): MoleculeData | null {
  try {
    const mol = Molecule.fromSmiles(smiles);
    const mf = mol.getMolecularFormula();
    const props = new MoleculeProperties(mol);
    const svg = mol.toSVG(svgWidth, svgHeight, undefined, { noStereoProblem: true });

    return {
      smiles,
      canonicalSmiles: mol.toSmiles(),
      formula: mf.formula,
      mw: mf.relativeWeight,
      logp: props.logP,
      hbd: props.donorCount,
      hba: props.acceptorCount,
      tpsa: props.polarSurfaceArea,
      rotatableBonds: props.rotatableBondCount,
      svg,
    };
  } catch {
    return null;
  }
}

export function renderSVG(smiles: string, width = 200, height = 150): string {
  try {
    const mol = Molecule.fromSmiles(smiles);
    return mol.toSVG(width, height, undefined, { noStereoProblem: true });
  } catch {
    return "";
  }
}

export function canonicalize(smiles: string): string | null {
  try {
    return Molecule.fromSmiles(smiles).toSmiles();
  } catch {
    return null;
  }
}

export function getIDCode(smiles: string): string | null {
  try {
    return Molecule.fromSmiles(smiles).getIDCode();
  } catch {
    return null;
  }
}

// Substructure search: is query a substructure of target?
export function isSubstructure(querySmiles: string, targetSmiles: string): boolean {
  try {
    const frag = Molecule.fromSmiles(querySmiles);
    frag.setFragment(true);
    const target = Molecule.fromSmiles(targetSmiles);
    const searcher = new SSSearcher();
    searcher.setFragment(frag);
    searcher.setMolecule(target);
    return searcher.isFragmentInMolecule();
  } catch {
    return false;
  }
}

// Create fingerprint index for a molecule
export function createFingerprint(smiles: string): number[] | null {
  try {
    const mol = Molecule.fromSmiles(smiles);
    const idx = new SSSearcherWithIndex();
    return Array.from(idx.createIndex(mol));
  } catch {
    return null;
  }
}

function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

// Tanimoto similarity between two fingerprints
export function tanimotoSimilarity(fp1: number[], fp2: number[]): number {
  if (!fp1 || !fp2 || fp1.length !== fp2.length) return 0;
  let andCount = 0, orCount = 0;
  for (let i = 0; i < fp1.length; i++) {
    andCount += popcount((fp1[i] & fp2[i]) >>> 0);
    orCount += popcount((fp1[i] | fp2[i]) >>> 0);
  }
  return orCount > 0 ? andCount / orCount : 0;
}

// Similarity search: how similar is query to target?
export function similarity(querySmiles: string, targetSmiles: string): number {
  const fp1 = createFingerprint(querySmiles);
  const fp2 = createFingerprint(targetSmiles);
  if (!fp1 || !fp2) return 0;
  return tanimotoSimilarity(fp1, fp2);
}

// Exact match using canonical SMILES
export function isExactMatch(smiles1: string, smiles2: string): boolean {
  const c1 = canonicalize(smiles1);
  const c2 = canonicalize(smiles2);
  if (!c1 || !c2) return false;
  return c1 === c2;
}

// Get molecular formula
export function getFormula(smiles: string): string {
  try {
    return Molecule.fromSmiles(smiles).getMolecularFormula().formula;
  } catch {
    return "";
  }
}

// Get molecular weight
export function getMW(smiles: string): number {
  try {
    return Molecule.fromSmiles(smiles).getMolecularFormula().relativeWeight;
  } catch {
    return 0;
  }
}

// Basic retrosynthesis rules
export interface RetroStep {
  targetSmiles: string;
  disconnection: string;
  precursors: string[];
  reaction: string;
  conditions: string;
}

export function getRetrosynthesis(smiles: string): RetroStep[] {
  const steps: RetroStep[] = [];
  const mol = parseSMILES(smiles);
  if (!mol) return steps;

  const smilesStr = smiles;

  // Check for ester group (C(=O)O pattern)
  if (smilesStr.includes("C(=O)O") || smilesStr.includes("OC(=O)")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "Ester hydrolysis",
      precursors: ["Carboxylic acid (R-COOH)", "Alcohol (R'-OH)"],
      reaction: "Fischer esterification",
      conditions: "H2SO4, reflux",
    });
  }

  // Check for amide group
  if (smilesStr.includes("C(=O)N") || smilesStr.includes("NC(=O)")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "Amide bond",
      precursors: ["Carboxylic acid (R-COOH)", "Amine (R'-NH2)"],
      reaction: "Amide coupling",
      conditions: "EDC/HOBt, DMF, RT",
    });
  }

  // Check for biaryl (Suzuki coupling)
  if (smilesStr.includes("c1ccc(-c2") || smilesStr.includes("c(-c1") || smilesStr.includes("c1ccc(cc1)c")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "Biaryl C-C bond",
      precursors: ["Aryl halide (Ar-X)", "Aryl boronic acid (Ar'-B(OH)2)"],
      reaction: "Suzuki coupling",
      conditions: "Pd(PPh3)4, Na2CO3, DME, 80°C",
    });
  }

  // Check for secondary alcohol (Grignard)
  if (smilesStr.includes("C(O)") || smilesStr.includes("(O)C")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "C-C bond at alcohol",
      precursors: ["Aldehyde (R-CHO)", "Grignard reagent (R'-MgBr)"],
      reaction: "Grignard reaction",
      conditions: "THF, -78°C to RT",
    });
  }

  // Check for alkene (Wittig)
  if (smilesStr.includes("=C") || smilesStr.includes("C=")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "C=C double bond",
      precursors: ["Aldehyde/Ketone", "Phosphonium ylide (Ph3P=CR2)"],
      reaction: "Wittig reaction",
      conditions: "BuLi, THF, 0°C",
    });
  }

  // Check for aromatic ring substitution
  if (smilesStr.includes("c1ccc")) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "Aromatic substitution",
      precursors: ["Aromatic substrate", "Electrophile"],
      reaction: "Electrophilic aromatic substitution",
      conditions: "Lewis acid catalyst, RT-reflux",
    });
  }

  // If nothing specific, suggest generic disconnections
  if (steps.length === 0) {
    steps.push({
      targetSmiles: smiles,
      disconnection: "Functional group interconversion",
      precursors: ["Simpler precursor"],
      reaction: "FGI approach",
      conditions: "Various",
    });
  }

  return steps;
}
