import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileSpreadsheet, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onSuccess?: (analysisId: string) => void;
}

export default function FileUpload({ onSuccess }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest('POST', '/api/upload', formData);
        const result = await response.json();
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your financial data has been analyzed successfully!",
      });
      if (onSuccess && data.analysisId) {
        onSuccess(data.analysisId);
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, Excel, or CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-destructive" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-6 w-6 text-accent" />;
      case 'csv':
        return <File className="h-6 w-6 text-primary" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  if (uploadMutation.isPending) {
    return (
      <Card className="glassmorphism bg-card/60 border border-border">
        <CardContent className="p-12 text-center">
          <div className="mb-6">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-2xl font-semibold mb-2">Processing Your Data</h3>
            <p className="text-muted-foreground mb-4">
              AI is analyzing your transactions and categorizing expenses...
            </p>
            <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadMutation.isSuccess) {
    return (
      <Card className="glassmorphism bg-card/60 border border-border">
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Analysis Complete!</h3>
          <p className="text-muted-foreground mb-6">
            Your financial data has been successfully processed and analyzed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <div className="text-2xl font-bold text-accent">
                {uploadMutation.data?.metrics?.totalIncome 
                  ? `$${uploadMutation.data.metrics.totalIncome.toLocaleString()}`
                  : '$0'
                }
              </div>
              <div className="text-sm text-muted-foreground">Income</div>
            </div>
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">
                {uploadMutation.data?.metrics?.totalExpenses 
                  ? `$${uploadMutation.data.metrics.totalExpenses.toLocaleString()}`
                  : '$0'
                }
              </div>
              <div className="text-sm text-muted-foreground">Expenses</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {uploadMutation.data?.metrics?.savingsRate 
                  ? `${uploadMutation.data.metrics.savingsRate.toFixed(1)}%`
                  : '0%'
                }
              </div>
              <div className="text-sm text-muted-foreground">Savings Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card 
        className={`glassmorphism bg-card/60 border-2 border-dashed transition-all cursor-pointer ${
          dragActive 
            ? 'border-primary/50 bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        data-testid="upload-area"
      >
        <CardContent className="p-12 text-center">
          <div className="mb-6">
            <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Drag & Drop Your Files</h3>
            <p className="text-muted-foreground mb-6">
              Or click to browse and select your bank statements
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2 bg-secondary/80 rounded-lg px-4 py-2">
              {getFileIcon('pdf')}
              <span className="text-sm">PDF</span>
            </div>
            <div className="flex items-center space-x-2 bg-secondary/80 rounded-lg px-4 py-2">
              {getFileIcon('xlsx')}
              <span className="text-sm">Excel</span>
            </div>
            <div className="flex items-center space-x-2 bg-secondary/80 rounded-lg px-4 py-2">
              {getFileIcon('csv')}
              <span className="text-sm">CSV</span>
            </div>
          </div>
          
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold transform hover:scale-105 transition-all"
            data-testid="button-choose-files"
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={false}
            accept=".pdf,.xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />
          
          <div className="mt-6 text-sm text-muted-foreground flex items-center justify-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>Your files are encrypted and automatically deleted after processing</span>
          </div>
        </CardContent>
      </Card>

      {uploadMutation.error && (
        <Alert variant="destructive" data-testid="alert-upload-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadMutation.error instanceof Error 
              ? uploadMutation.error.message 
              : 'An error occurred while uploading your file. Please try again.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
