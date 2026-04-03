import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chemicals = sqliteTable("chemicals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  smiles: text("smiles").notNull(),
  canonicalSmiles: text("canonical_smiles").notNull(),
  formula: text("formula"),
  mw: real("mw"),
  logp: real("logp"),
  hbd: integer("hbd"),
  hba: integer("hba"),
  tpsa: real("tpsa"),
  rotatableBonds: integer("rotatable_bonds"),
  inchi: text("inchi"),
  source: text("source").notNull().default("built-in"),
  pdfId: integer("pdf_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  textContent: text("text_content"),
  pageCount: integer("page_count"),
  uploadedAt: text("uploaded_at").notNull().default(""),
});

export const reactions = sqliteTable("reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reactantSmiles: text("reactant_smiles").notNull(),
  productSmiles: text("product_smiles").notNull(),
  conditions: text("conditions"),
  reagents: text("reagents"),
  source: text("source").notNull().default("built-in"),
  pdfId: integer("pdf_id"),
  createdAt: text("created_at").notNull().default(""),
});

export const searchHistory = sqliteTable("search_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  querySmiles: text("query_smiles"),
  queryText: text("query_text"),
  searchType: text("search_type").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export const insertChemicalSchema = createInsertSchema(chemicals).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true });
export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({ id: true });

export type Chemical = typeof chemicals.$inferSelect;
export type InsertChemical = z.infer<typeof insertChemicalSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
