import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up file upload
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files allowed"));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Seed database on startup
  seedDatabase();

  // --- Chemicals ---
  app.get("/api/chemicals", (_req, res) => {
    const all = storage.getAllChemicals();
    res.json(all);
  });

  app.get("/api/chemicals/search", (req, res) => {
    const q = (req.query.q as string) || "";
    const results = storage.searchChemicalsByName(q);
    res.json(results);
  });

  app.get("/api/chemicals/:id", (req, res) => {
    const chem = storage.getChemical(Number(req.params.id));
    if (!chem) return res.status(404).json({ error: "Not found" });
    res.json(chem);
  });

  app.post("/api/chemicals", (req, res) => {
    try {
      const chem = storage.createChemical({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.json(chem);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // --- Documents ---
  app.get("/api/documents", (_req, res) => {
    const docs = storage.getAllDocuments();
    res.json(docs);
  });

  app.get("/api/documents/:id", (req, res) => {
    const doc = storage.getDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      let textContent = "";
      let pageCount = 0;
      try {
        const pdfParse = require("pdf-parse/lib/pdf-parse.js");
        // Use v1.9.426 which handles small PDFs correctly
        const pdfOptions = { version: "v1.9.426" };
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(buffer, pdfOptions);
        textContent = data.text || "";
        pageCount = data.numpages || 0;
      } catch (e) {
        console.error("PDF parse error:", e);
      }

      const doc = storage.createDocument({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        textContent,
        pageCount,
        uploadedAt: new Date().toISOString(),
      });

      // Extract chemical names from text
      const extractedChemicals = extractChemicalsFromText(textContent, doc.id);
      for (const chem of extractedChemicals) {
        try { storage.createChemical(chem); } catch { }
      }

      res.json({ document: doc, extractedCount: extractedChemicals.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/documents/:id/file", (req, res) => {
    const doc = storage.getDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.originalName}"`);
    fs.createReadStream(doc.filePath).pipe(res);
  });

  app.delete("/api/documents/:id", (req, res) => {
    const doc = storage.getDocument(Number(req.params.id));
    if (doc && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    storage.deleteDocument(Number(req.params.id));
    res.json({ success: true });
  });

  // --- Reactions ---
  app.get("/api/reactions", (_req, res) => {
    res.json(storage.getAllReactions());
  });

  app.post("/api/reactions", (req, res) => {
    try {
      const rxn = storage.createReaction({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.json(rxn);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // --- Search History ---
  app.get("/api/history", (_req, res) => {
    res.json(storage.getSearchHistory());
  });

  app.post("/api/history", (req, res) => {
    try {
      const entry = storage.createSearchHistory({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    storage.deleteSearchHistory(Number(req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/history", (_req, res) => {
    storage.clearSearchHistory();
    res.json({ success: true });
  });

  return httpServer;
}

// Basic chemical name/SMILES extractor from PDF text
function extractChemicalsFromText(text: string, pdfId: number) {
  const KNOWN_NAMES: Record<string, string> = {
    "benzene": "c1ccccc1",
    "toluene": "Cc1ccccc1",
    "phenol": "Oc1ccccc1",
    "aniline": "Nc1ccccc1",
    "naphthalene": "c1ccc2ccccc2c1",
    "anthracene": "c1ccc2cc3ccccc3cc2c1",
    "aspirin": "CC(=O)Oc1ccccc1C(=O)O",
    "caffeine": "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
    "ibuprofen": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
    "paracetamol": "CC(=O)Nc1ccc(O)cc1",
    "acetaminophen": "CC(=O)Nc1ccc(O)cc1",
    "morphine": "CN1CCC23c4c5ccc(O)c4OC2C(=CC1C3C5)O",
    "cholesterol": "CC(CCCC(C)C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C",
    "glucose": "OCC1OC(O)C(O)C(O)C1O",
    "nicotine": "CN1CCCC1c1cccnc1",
    "dopamine": "NCCc1ccc(O)c(O)c1",
    "serotonin": "NCCc1c[nH]c2ccc(O)cc12",
    "adrenaline": "CNCC(O)c1ccc(O)c(O)c1",
    "epinephrine": "CNCC(O)c1ccc(O)c(O)c1",
    "nitrobenzene": "O=[N+]([O-])c1ccccc1",
    "benzoic acid": "OC(=O)c1ccccc1",
    "acetone": "CC(=O)C",
    "ethanol": "CCO",
    "acetic acid": "CC(=O)O",
    "methanol": "CO",
    "vanillin": "O=Cc1ccc(O)c(OC)c1",
    "cinnamaldehyde": "O=C/C=C/c1ccccc1",
    "limonene": "CC(=C)C1CCC(=CC1)C",
    "menthol": "CC1CCC(C(C1)O)C(C)C",
    "camphor": "CC1(C)C2CCC(C)(C2)C1=O",
    "pyridine": "c1ccncc1",
    "quinoline": "c1ccc2ncccc2c1",
    "isoquinoline": "c1ccc2cnccc2c1",
    "furan": "c1ccoc1",
    "thiophene": "c1ccsc1",
    "pyrrole": "c1cc[nH]c1",
    "indole": "c1ccc2[nH]ccc2c1",
    "purine": "c1ncc2[nH]cnc2n1",
    "testosterone": "CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2O",
    "estradiol": "CC12CCC3C(CCc4cc(O)ccc43)C1CCC2O",
    "cortisol": "OC1(CCC2C1(CCC(=O)C3C2CCC4=CC(=O)CCC34C)C)C(=O)CO",
    "progesterone": "CC(=O)C1CCC2C1(CCC3C2CCC4=CC(=O)CCC34C)C",
    "adenine": "Nc1ncnc2[nH]cnc12",
    "guanine": "Nc1nc2[nH]cnc2c(=O)[nH]1",
    "cytosine": "Nc1ccn(c(=O)n1)",
    "thymine": "Cc1cn(c(=O)[nH]c1=O)",
    "uracil": "O=c1cc[nH]c(=O)[nH]1",
    "fructose": "OCC(O)C(O)C(O)C(=O)CO",
    "sucrose": "OCC1OC(OC2(CO)OC(CO)C(O)C2O)C(O)C(O)C1O",
    "penicillin": "CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O",
    "penicillin g": "CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O",
    "retinol": "CC1=C(C(CCC1)(C)C)/C=C/C(=C/C=C/C(=C/CO)/C)/C",
    "ascorbic acid": "OCC(O)C1OC(=O)C(O)=C1O",
    "vitamin c": "OCC(O)C1OC(=O)C(O)=C1O",
    "coumarin": "O=c1ccc2ccccc2o1",
    "capsaicin": "COc1cc(CNC(=O)CCCCCC=CC(C)C)ccc1O",
    "thymol": "Cc1ccc(C(C)C)c(O)c1",
    "eugenol": "C=CCc1ccc(O)c(OC)c1",
    "acridine": "c1ccc2nc3ccccc3cc2c1",
    "ribose": "OCC1OC(O)C(O)C1O",
    "lactose": "OCC1OC(O)C(O)C(OC2OC(CO)C(O)C(O)C2O)C1O",
    "stearic acid": "CCCCCCCCCCCCCCCCCC(=O)O",
    "oleic acid": "CCCCCCCC/C=C\\CCCCCCCC(=O)O",
    "glycine": "NCC(=O)O",
    "alanine": "CC(N)C(=O)O",
  };

  const results: any[] = [];
  const lower = text.toLowerCase();

  for (const [name, smiles] of Object.entries(KNOWN_NAMES)) {
    if (lower.includes(name)) {
      results.push({
        name: name.charAt(0).toUpperCase() + name.slice(1) + " (from PDF)",
        smiles,
        canonicalSmiles: smiles,
        formula: "",
        mw: 0,
        logp: 0,
        hbd: 0,
        hba: 0,
        tpsa: 0,
        rotatableBonds: 0,
        inchi: "",
        source: "pdf",
        pdfId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Also extract SMILES-like patterns
  const smilesRegex = /[A-Za-z0-9@+\-\[\]()=#\/\\]{4,200}/g;
  const matches = text.match(smilesRegex) || [];
  for (const match of matches.slice(0, 20)) {
    if (/^[A-Za-z0-9@+\-\[\]()=#\/\\.]+$/.test(match) && /[cnos]/.test(match.toLowerCase())) {
      results.push({
        name: "Extracted structure",
        smiles: match,
        canonicalSmiles: match,
        formula: "",
        mw: 0,
        logp: 0,
        hbd: 0,
        hba: 0,
        tpsa: 0,
        rotatableBonds: 0,
        inchi: "",
        source: "pdf",
        pdfId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
