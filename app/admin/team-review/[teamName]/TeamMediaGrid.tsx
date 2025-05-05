'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiX } from 'react-icons/fi';
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

  useEffect(() => {
    const fetchTeamMedia = async () => {
      try {
        const response = await fetch(`/api/team-items?team=${encodeURIComponent(teamName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team media');
        }
        const data = await response.json();
        setMediaItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team media');
      }
    };

    fetchTeamMedia();
  }, [teamName]);

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
                    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedMedia(item)}
                  >
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
                    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedMedia(item)}
                  >
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <FiX size={24} />
          </button>
          <div className="max-w-4xl w-full max-h-[90vh]">
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
        </div>
      )}
    </>
  );
} 