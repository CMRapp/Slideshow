export interface Team {
  id: string;
  name: string;
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

export interface ProgressStatus {
  stage: 'compressing' | 'uploading' | 'processing' | 'success' | 'error';
  currentFile: string;
  currentNumber: number;
  totalFiles: number;
  percent?: number;
  currentSize?: number;
  totalSize?: number;
  error?: string;
} 