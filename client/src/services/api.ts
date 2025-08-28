import { apiRequest } from "@/lib/queryClient";

export interface UploadResponse {
  success: boolean;
  analysisId: string;
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
  };
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiRequest('POST', '/api/upload', formData);
  return response.json();
};

export const getAnalysis = async (id: string) => {
  const response = await apiRequest('GET', `/api/analysis/${id}`);
  return response.json();
};

export const healthCheck = async () => {
  const response = await apiRequest('GET', '/api/health');
  return response.json();
};
