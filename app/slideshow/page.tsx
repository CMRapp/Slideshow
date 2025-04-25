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
        // No need to process file paths as they are now full Blob Store URLs
        const shuffledItems = [...data.mediaItems];
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
                      alt={`Slide ${currentIndex + 1}`}
                      fill
                      sizes="90vw"
                      className="object-contain"
                      priority
                      quality={100}
                      unoptimized={true}
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
                  />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="container mx-auto text-center">
                <p className="text-white text-xl">
                  <span className="font-semibold">Team {currentItem.team_name}</span>
                  <span className="mx-2">•</span>
                  <span>{currentItem.item_type === 'photo' ? 'Photo' : 'Video'} {currentItem.item_number}</span>
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SidebarLayout>
  );
} 