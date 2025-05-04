import { ProgressStatus } from '@/app/types/upload';

interface UploadProgressProps {
  progress: ProgressStatus;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getProgressText = () => {
    switch (progress.stage) {
      case 'compressing':
        return `Compressing ${progress.currentFile} (${progress.currentNumber}/${progress.totalFiles}) - ${formatFileSize(progress.currentSize || 0)}`;
      case 'uploading':
        return `Uploading files to server... ${progress.percent ? `${progress.percent}%` : ''}`;
      case 'processing':
        return 'Processing upload...';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (progress.stage) {
      case 'compressing':
        return 'bg-blue-500/20 text-blue-300';
      case 'uploading':
        return 'bg-purple-500/20 text-purple-300';
      case 'processing':
        return 'bg-green-500/20 text-green-300';
      default:
        return '';
    }
  };

  return (
    <div className={`mt-4 p-4 rounded ${getProgressColor()}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <div className="text-sm font-medium">{getProgressText()}</div>
          <div className="mt-2 h-2 w-full bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-300 ease-in-out rounded-full"
              style={{ 
                width: `${progress.percent || (progress.currentNumber / progress.totalFiles) * 100}%`
              }}
            />
          </div>
          {progress.totalSize && (
            <div className="mt-1 text-xs text-gray-400">
              Total size: {formatFileSize(progress.totalSize)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 