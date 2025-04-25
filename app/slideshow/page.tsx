'use client';

import { useState, useEffect } from 'react';
import { FiImage } from 'react-icons/fi';
import Image from 'next/image';
import SidebarLayout from '@/app/components/SidebarLayout';

interface MediaItem {
  id: number;
  team_name: string;
  file_type: string;
  file_path: string;
  file_name: string;
  item_type?: string;
  item_number?: number;
}

export default function SlideshowPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMediaItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Slideshow: Starting to fetch media items...');
      
      const response = await fetch('/api/media');
      console.log('Slideshow: Media API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Slideshow: Media API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch media items');
      }
      
      const data = await response.json();
      console.log('Slideshow: Raw API response:', data);
      
      if (!data.mediaItems || data.mediaItems.length === 0) {
        console.log('Slideshow: No media items found in API response');
        setMediaItems([]);
        return;
      }

      // Validate URLs
      const validItems = data.mediaItems.filter((item: MediaItem) => {
        const isValid = item.file_path && (
          item.file_path.startsWith('https://') || 
          item.file_path.startsWith('http://')
        );
        
        if (!isValid) {
          console.warn('Slideshow: Invalid file path found:', {
            id: item.id,
            team_name: item.team_name,
            file_path: item.file_path
          });
        }
        
        return isValid;
      });

      console.log('Slideshow: Valid media items:', {
        total: validItems.length,
        items: validItems
      });

      if (validItems.length === 0) {
        throw new Error('No valid media items found');
      }

      // Shuffle the items
      const shuffledItems = [...validItems];
      for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
      }

      console.log('Slideshow: Setting media items:', {
        count: shuffledItems.length,
        firstItem: shuffledItems[0]
      });

      setMediaItems(shuffledItems);
    } catch (err) {
      console.error('Slideshow: Error in fetchMediaItems:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media items');
      setMediaItems([]);
    } finally {
      setIsLoading(false);
    }
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
          
          if (cycleCount % (mediaItems.length * 5) === 0) {
            shuffleMediaItems();
          }
          
          return nextIndex;
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, mediaItems.length]);

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

  return (
    <SidebarLayout
      isPlaying={isPlaying}
      onPlayPause={() => setIsPlaying(!isPlaying)}
    >
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/treasure-hunt.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="relative w-full h-full flex items-center justify-center bg-black/40">
        {mediaItems.length > 0 ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {currentItem.file_type.startsWith('image/') ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                    <Image
                      src={currentItem.file_path}
                      alt={`${currentItem.team_name} - ${currentItem.item_type} ${currentItem.item_number}`}
                      fill
                      sizes="90vw"
                      className="object-contain"
                      priority
                      quality={100}
                      unoptimized={true}
                      onError={(e) => {
                        console.error('Image failed to load:', currentItem.file_path);
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={currentItem.file_path}
                    className="max-w-[90vw] max-h-[90vh] object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={(e) => {
                      console.error('Video failed to load:', currentItem.file_path);
                      const video = e.target as HTMLVideoElement;
                      video.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/80">
              <div className="container mx-auto text-center py-4">
                <h3 className="text-white text-2xl font-semibold tracking-wide">
                  <span>Team {currentItem.team_name}</span>
                  <span className="mx-3 text-yellow-500">•</span>
                  <span>{currentItem.item_type === 'photo' ? 'Photo' : 'Video'} {currentItem.item_number}</span>
                </h3>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SidebarLayout>
  );
} 