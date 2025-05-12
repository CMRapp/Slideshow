import { ProgressStatus } from '@/app/types/upload';

interface UploadProgressProps {
  progress: ProgressStatus;
  onDismiss?: () => void;
}

export function UploadProgress({ progress, onDismiss }: UploadProgressProps) {
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
      case 'success':
        return 'Upload completed successfully!';
      case 'error':
        return progress.error || 'Upload failed. Please try again.';
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
      case 'success':
        return 'bg-green-500/20 text-green-300';
      case 'error':
        return 'bg-red-500/20 text-red-300';
      default:
        return '';
    }
  };

  const showProgressBar = progress.stage !== 'success' && progress.stage !== 'error';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${getProgressColor()}`}>
        <div className="flex flex-col items-center">
          <div className="text-lg font-medium mb-4">{getProgressText()}</div>
          {showProgressBar && (
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-current transition-all duration-300 ease-in-out rounded-full"
                style={{ 
                  width: `${progress.percent || (progress.currentNumber / progress.totalFiles) * 100}%`
                }}
              />
            </div>
          )}
          {progress.totalSize && showProgressBar && (
            <div className="text-sm text-gray-400 mb-4">
              Total size: {formatFileSize(progress.totalSize)}
            </div>
          )}
          {(progress.stage === 'success' || progress.stage === 'error') && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 