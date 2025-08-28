import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  totalIncome: real("total_income").default(0),
  totalExpenses: real("total_expenses").default(0),
  savingsRate: real("savings_rate").default(0),
  transactions: jsonb("transactions").notNull(),
  categories: jsonb("categories").notNull(),
  recommendations: jsonb("recommendations").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisSchema = createInsertSchema(analysisResults).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

// Transaction and Category types
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface Recommendation {
  id: string;
  type: 'savings' | 'investment' | 'budget';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}
