'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiX, FiImage, FiVideo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Image from 'next/image';

interface MediaItem {
  id: number;
  type: 'photo' | 'video';
  url: string;
  number: number;
}

interface TeamMediaGridProps {
  teamName: string;
}

export default function TeamMediaGrid({ teamName }: TeamMediaGridProps) {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/team-items?team=${encodeURIComponent(teamName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team media');
        }
        const data = await response.json();
        setMediaItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team media');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMedia();
  }, [teamName]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!selectedMedia) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setSelectedMedia(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, handleNext, handlePrevious]);

  const handlePrevious = () => {
    if (!selectedMedia) return;
    const currentIndex = mediaItems.findIndex(item => item.id === selectedMedia.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : mediaItems.length - 1;
    setSelectedMedia(mediaItems[previousIndex]);
  };

  const handleNext = () => {
    if (!selectedMedia) return;
    const currentIndex = mediaItems.findIndex(item => item.id === selectedMedia.id);
    const nextIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
    setSelectedMedia(mediaItems[nextIndex]);
  };

  if (error) {
    return (
      <>
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin?tab=review')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft />
            Back
          </button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <div className="p-4 bg-red-900 text-white rounded-lg">
          {error}
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin?tab=review')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft />
            Back
          </button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => router.push('/admin?tab=review')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <FiArrowLeft />
        Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Team {teamName} Media</h1>
        <p>Click on a photo or video to view it.</p>
      </div>

      {mediaItems.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No media items found for this team.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Photos Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Photos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {mediaItems
                .filter(item => item.type === 'photo')
                .map(item => (
                  <div
                    key={item.id}
                    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <Image
                      src={item.url}
                      alt={`Photo ${item.number}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      unoptimized
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image failed to load:', item.url);
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center text-white text-sm">
                      Photo {item.number}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Videos Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {mediaItems
                .filter(item => item.type === 'video')
                .map(item => (
                  <div
                    key={item.id}
                    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiVideo className="w-12 h-12 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Video failed to load:', item.url);
                        const video = e.target as HTMLVideoElement;
                        video.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center text-white text-sm">
                      Video {item.number}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <FiX size={24} />
          </button>

          <div 
            className="max-w-4xl w-full max-h-[90vh] relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Buttons - now outside the media */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute z-20 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
              style={{ left: '-20px', top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Previous"
            >
              <FiChevronLeft size={32} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute z-20 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
              style={{ right: '-20px', top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Next"
            >
              <FiChevronRight size={32} />
            </button>

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center">
              {selectedMedia.type === 'photo' ? (
                <Image
                  src={selectedMedia.url}
                  alt={`Photo ${selectedMedia.number}`}
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[90vh] object-contain"
                  unoptimized
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Image failed to load:', selectedMedia.url);
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  className="w-full max-h-[90vh]"
                  controls
                  autoPlay
                  loop
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Video failed to load:', selectedMedia.url);
                    const video = e.target as HTMLVideoElement;
                    video.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
              {selectedMedia.type === 'photo' ? 'Photo' : 'Video'} {selectedMedia.number} of {mediaItems.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 