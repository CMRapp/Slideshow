'use client';

import { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiImage } from 'react-icons/fi';
import SidebarLayout from '@/app/components/SidebarLayout';

interface MediaItem {
  id: number;
  team_name: string;
  file_type: string;
  file_path: string;
  thumbnail_path: string | null;
  item_type?: string;
  item_number?: number;
}

export default function SlideshowPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Function to shuffle media items
  const shuffleMediaItems = () => {
    setMediaItems(prevItems => {
      const newItems = [...prevItems];
      for (let i = newItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
      }
      return newItems;
    });
  };

  useEffect(() => {
    fetchMediaItems();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let cycleCount = 0;
    
    if (isPlaying && mediaItems.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % mediaItems.length;
          cycleCount++;
          
          // Shuffle items every 5 cycles through the slideshow
          if (cycleCount % (mediaItems.length * 5) === 0) {
            shuffleMediaItems();
          }
          
          return nextIndex;
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mediaItems.length]);

  const fetchMediaItems = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching media items...');
      const response = await fetch('/api/media');
      console.log('Media API response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Media API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch media items');
      }
      
      const data = await response.json();
      console.log('Media items received:', data);
      
      if (!data.mediaItems || data.mediaItems.length === 0) {
        console.log('No media items found');
        setMediaItems([]);
      } else {
        // Ensure file paths are absolute
        const processedData = data.mediaItems.map((item: MediaItem) => ({
          ...item,
          file_path: item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`,
          thumbnail_path: item.thumbnail_path ? (item.thumbnail_path.startsWith('/') ? item.thumbnail_path : `/${item.thumbnail_path}`) : null
        }));
        console.log('Processed media items:', processedData);
        // Shuffle the items before setting them
        const shuffledItems = [...processedData];
        for (let i = shuffledItems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
        }
        setMediaItems(shuffledItems);
      }
    } catch (err) {
      console.error('Error in fetchMediaItems:', err);
      setError('Failed to load media items');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <p className="text-white">{error}</p>
            <button
              onClick={fetchMediaItems}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-white">Loading media...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
            <FiImage className="mx-auto text-6xl text-white/40 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Media Items</h2>
            <p className="text-white/80 mb-4">There are no media items to display yet.</p>
            <a
              href="/upload"
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Upload Media
            </a>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const currentItem = mediaItems[currentIndex];
  console.log('Current media item:', currentItem);

  return (
    <SidebarLayout 
      isPlaying={isPlaying}
      onPlayPause={togglePlay}
      onVolumeChange={(volume) => {
        // Update video volume if there's a video element
        const videoElement = document.querySelector('video');
        if (videoElement) {
          videoElement.volume = volume / 100;
        }
      }}
    >
      <div className="flex-1 relative flex items-center justify-center overflow-hidden h-full">
        {/* Background with z-index -1 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/treasure-hunt.jpg')`,
            zIndex: -1,
            filter: 'brightness(0.5)'
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {currentItem.file_type.startsWith('image/') ? (
              <img
                src={currentItem.file_path}
                alt={currentItem.team_name}
                className="max-w-full max-h-[calc(100vh-8rem)] w-auto h-auto object-contain rounded-[3px] border-2 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 8rem)',
                  width: 'auto',
                  height: 'auto'
                }}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  const target = e.target as HTMLImageElement;
                  console.error('Failed to load image:', target.src);
                }}
              />
            ) : (
              <video
                src={currentItem.file_path}
                className="max-w-full max-h-[calc(100vh-8rem)] w-auto h-auto object-contain rounded-[3px] border-2 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 8rem)',
                  width: 'auto',
                  height: 'auto'
                }}
                autoPlay={isPlaying}
                loop
                muted={false}
                onError={(e) => {
                  console.error('Error loading video:', e);
                  const target = e.target as HTMLVideoElement;
                  console.error('Failed to load video:', target.src);
                }}
              />
            )}
          </div>
        </div>
        
        {/* Team Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-4 rounded-lg">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-white">
              Team {currentItem.team_name}{currentItem.file_type.startsWith('image/') ? ` Photo #${currentItem.item_number}` : ` Video #${currentItem.item_number}`}
            </h2>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 