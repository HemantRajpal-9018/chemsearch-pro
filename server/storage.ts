import {
  type Chemical, type InsertChemical, chemicals,
  type Document, type InsertDocument, documents,
  type Reaction, type InsertReaction, reactions,
  type SearchHistory, type InsertSearchHistory, searchHistory,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, like, and, gte, lte, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist (avoids needing external migration runner)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chemicals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    smiles TEXT NOT NULL,
    canonical_smiles TEXT NOT NULL,
    formula TEXT,
    mw REAL,
    logp REAL,
    hbd INTEGER,
    hba INTEGER,
    tpsa REAL,
    rotatable_bonds INTEGER,
    inchi TEXT,
    source TEXT NOT NULL DEFAULT 'built-in',
    pdf_id INTEGER,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    text_content TEXT,
    page_count INTEGER,
    uploaded_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reactant_smiles TEXT NOT NULL,
    product_smiles TEXT NOT NULL,
    conditions TEXT,
    reagents TEXT,
    source TEXT NOT NULL DEFAULT 'built-in',
    pdf_id INTEGER,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_smiles TEXT,
    query_text TEXT,
    search_type TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  // Chemicals
  getAllChemicals(): Chemical[];
  getChemical(id: number): Chemical | undefined;
  searchChemicalsByName(query: string): Chemical[];
  createChemical(chem: InsertChemical): Chemical;
  getChemicalsBySource(source: string): Chemical[];
  getChemicalsByPdfId(pdfId: number): Chemical[];

  // Documents
  getAllDocuments(): Document[];
  getDocument(id: number): Document | undefined;
  createDocument(doc: InsertDocument): Document;
  deleteDocument(id: number): void;

  // Reactions
  getAllReactions(): Reaction[];
  createReaction(rxn: InsertReaction): Reaction;

  // Search History
  getSearchHistory(): SearchHistory[];
  createSearchHistory(entry: InsertSearchHistory): SearchHistory;
  deleteSearchHistory(id: number): void;
  clearSearchHistory(): void;
}

export class DatabaseStorage implements IStorage {
  getAllChemicals(): Chemical[] {
    return db.select().from(chemicals).all();
  }

  getChemical(id: number): Chemical | undefined {
    return db.select().from(chemicals).where(eq(chemicals.id, id)).get();
  }

  searchChemicalsByName(query: string): Chemical[] {
    return db.select().from(chemicals).where(like(chemicals.name, `%${query}%`)).all();
  }

  createChemical(chem: InsertChemical): Chemical {
    return db.insert(chemicals).values(chem).returning().get();
  }

  getChemicalsBySource(source: string): Chemical[] {
    return db.select().from(chemicals).where(eq(chemicals.source, source)).all();
  }

  getChemicalsByPdfId(pdfId: number): Chemical[] {
    return db.select().from(chemicals).where(eq(chemicals.pdfId, pdfId)).all();
  }

  getAllDocuments(): Document[] {
    return db.select().from(documents).all();
  }

  getDocument(id: number): Document | undefined {
    return db.select().from(documents).where(eq(documents.id, id)).get();
  }

  createDocument(doc: InsertDocument): Document {
    return db.insert(documents).values(doc).returning().get();
  }

  deleteDocument(id: number): void {
    db.delete(documents).where(eq(documents.id, id)).run();
    db.delete(chemicals).where(eq(chemicals.pdfId, id)).run();
  }

  getAllReactions(): Reaction[] {
    return db.select().from(reactions).all();
  }

  createReaction(rxn: InsertReaction): Reaction {
    return db.insert(reactions).values(rxn).returning().get();
  }

  getSearchHistory(): SearchHistory[] {
    return db.select().from(searchHistory).orderBy(desc(searchHistory.createdAt)).all();
  }

  createSearchHistory(entry: InsertSearchHistory): SearchHistory {
    return db.insert(searchHistory).values(entry).returning().get();
  }

  deleteSearchHistory(id: number): void {
    db.delete(searchHistory).where(eq(searchHistory.id, id)).run();
  }

  clearSearchHistory(): void {
    db.delete(searchHistory).run();
  }
}

export const storage = new DatabaseStorage();
