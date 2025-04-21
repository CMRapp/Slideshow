import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log('ImageViewer mounted with URL:', imageUrl);
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, imageUrl]);

  const handleClose = () => {
    console.log('Closing image viewer');
    setIsOpen(false);
    onClose();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', e);
    setImageError(true);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={handleClose}
    >
      <div 
        className="relative max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-white hover:text-yellow-400 transition-colors"
        >
          <X size={32} />
        </button>
        <div className="relative aspect-video w-full">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
              Failed to load image
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Full size view"
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={() => console.log('Image loaded successfully')}
            />
          )}
        </div>
      </div>
    </div>
  );
} 