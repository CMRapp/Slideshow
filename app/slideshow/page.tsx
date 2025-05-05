'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiImage, FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import Image from 'next/image';
import SidebarLayout from '@/app/components/SidebarLayout';
import controlStyles from '@/app/styles/SlideshowControls.module.css';

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
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const isVisibleRef = useRef(true);

  const fetchMediaItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error('Failed to fetch media items');
      }
      const data = await response.json();
      setMediaItems(data.mediaItems);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching media items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media items');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Calculate interval based on visibility and retry count
    const baseInterval = 30000; // 30 seconds
    const backoffMultiplier = Math.min(2 ** retryCount, 8); // Cap at 8x
    const visibilityMultiplier = isVisibleRef.current ? 1 : 4; // 4x slower when hidden
    
    const interval = baseInterval * backoffMultiplier * visibilityMultiplier;
    
    pollIntervalRef.current = setInterval(fetchMediaItems, interval);
  }, [fetchMediaItems, retryCount]);

  useEffect(() => {
    // Initial fetch
    fetchMediaItems();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      startPolling();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling
    startPolling();

    // Clean up
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMediaItems, startPolling]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let cycleCount = 0;
    
    if (isPlaying && !isPaused && mediaItems.length > 0) {
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
  }, [isPlaying, isPaused, mediaItems.length]);

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

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) return mediaItems.length - 1;
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-[100dvh]">
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
        <div className="flex items-center justify-center h-[100dvh]">
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
        <div className="flex items-center justify-center h-[100dvh]">
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

  const slideshowControls = mediaItems.length > 0 ? (
    <div className="flex flex-row lg:flex-col gap-2">
      <button
        className={`${controlStyles.controlButton} w-10 h-10 lg:w-12 lg:h-12`}
        onClick={handlePrevious}
        aria-label="Previous"
      >
        <FiSkipBack size={20} />
      </button>
      <button
        className={`${controlStyles.controlButton} w-10 h-10 lg:w-12 lg:h-12`}
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
      </button>
      <button
        className={`${controlStyles.controlButton} w-10 h-10 lg:w-12 lg:h-12`}
        onClick={handleNext}
        aria-label="Next"
      >
        <FiSkipForward size={20} />
      </button>
    </div>
  ) : null;

  return (
    <SidebarLayout slideshowControls={slideshowControls}>
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
      
      <div className="relative flex flex-col min-h-0 max-w-screen overflow-x-hidden border border-gray-600 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        <div 
          id="slideshow-item"
          className="w-full h-screen flex items-center justify-center m-0 p-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {mediaItems.length > 0 && (
            <>
              <div className="w-full flex flex-col items-start justify-start m-0 p-0">
                {currentItem.file_type.startsWith('image/') ? (
                  <div className="w-full flex items-center justify-center m-0 p-0">
                    <Image
                      src={currentItem.file_path}
                      alt={`${currentItem.team_name} - ${currentItem.item_type} ${currentItem.item_number}`}
                      width={800}
                      height={600}
                      sizes="100vw"
                      className="object-contain w-full max-w-[100vw] md:max-w-4xl md:max-h-[80vh] h-auto mx-auto m-0 p-0"
                      priority
                      quality={100}
                      unoptimized={false}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image failed to load:', currentItem.file_path);
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center m-0 p-0">
                    <video
                      src={currentItem.file_path}
                      className="object-contain w-full max-w-[100vw] md:max-w-4xl md:max-h-[80vh] m-0 p-0 mx-auto"
                      autoPlay
                      loop
                      playsInline
                      controls
                      controlsList="nodownload noremoteplayback"
                      crossOrigin="anonymous"
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        video.volume = 0.05;
                      }}
                      onError={(e) => {
                        console.error('Video failed to load:', currentItem.file_path);
                        const video = e.target as HTMLVideoElement;
                        video.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="w-full text-white text-center m-0 p-0">
                  <h2 className="inline-block mr-2">Team {currentItem.team_name}</h2>
                  <h2 className="inline-block opacity-80">
                    {currentItem.item_type ? `${currentItem.item_type.charAt(0).toUpperCase() + currentItem.item_type.slice(1)} ${currentItem.item_number}` : currentItem.file_name}
                  </h2>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
} 