import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAnalysisSchema } from "@shared/schema";
import { processFile } from "./services/fileProcessor";
import { categorizeTransactions } from "./services/categorizer";
import { generateAnalysis, generateRecommendations } from "./services/analysisService";

// Extend Request interface to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload and analysis endpoint
  app.post('/api/upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileType = path.extname(fileName).toLowerCase();

      try {
        // Process the uploaded file
        const rawTransactions = await processFile(filePath, fileType);
        
        // Categorize transactions
        const categorizedTransactions = await categorizeTransactions(rawTransactions);
        
        // Generate financial analysis
        const metrics = generateAnalysis(categorizedTransactions);
        
        // Generate recommendations
        const recommendations = generateRecommendations(categorizedTransactions, metrics);
        
        // Create analysis result
        const analysisData = {
          userId: null, // For now, no user system
          fileName,
          fileType,
          totalIncome: metrics.totalIncome,
          totalExpenses: metrics.totalExpenses,
          savingsRate: metrics.savingsRate,
          transactions: categorizedTransactions,
          categories: metrics.categories,
          recommendations,
        };

        const analysis = await storage.createAnalysis(analysisData);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          analysisId: analysis.id,
          metrics: {
            totalIncome: analysis.totalIncome,
            totalExpenses: analysis.totalExpenses,
            savingsRate: analysis.savingsRate,
          },
        });

      } catch (error) {
        // Clean up file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw error;
      }

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to process file' 
      });
    }
  });

  // Get analysis results
  app.get('/api/analysis/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ message: 'Failed to retrieve analysis' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
