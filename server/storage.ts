import { type User, type InsertUser, type AnalysisResult, type InsertAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis results methods
  createAnalysis(analysis: InsertAnalysis): Promise<AnalysisResult>;
  getAnalysis(id: string): Promise<AnalysisResult | undefined>;
  getAnalysesByUserId(userId: string): Promise<AnalysisResult[]>;
  deleteAnalysis(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: Map<string, AnalysisResult>;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<AnalysisResult> {
    const id = randomUUID();
    const analysis: AnalysisResult = {
      ...insertAnalysis,
      id,
      uploadedAt: new Date(),
      userId: insertAnalysis.userId ?? null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<AnalysisResult | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByUserId(userId: string): Promise<AnalysisResult[]> {
    return Array.from(this.analyses.values()).filter(
      (analysis) => analysis.userId === userId
    );
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    return this.analyses.delete(id);
  }
}

export const storage = new MemStorage();
