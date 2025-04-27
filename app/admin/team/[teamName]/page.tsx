'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Image from 'next/image';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
}

export default function TeamMediaPage() {
  const router = useRouter();
  const { teamName } = useParams();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/media/team/${teamName}`, {
          credentials: 'include', // Include cookies for authentication
        });

        if (response.status === 401) {
          // Redirect to login if unauthorized
          router.push('/admin/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch team media');
        }

        const data = await response.json();
        setMediaItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team media');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMedia();
  }, [teamName, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Error</h1>
          </div>
          <div className="p-4 bg-red-900/50 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">{teamName}&apos;s Media</h1>
        </div>

        {mediaItems.length === 0 ? (
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No media found for this team</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group"
              >
                {item.type === 'photo' ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={`Media item ${item.id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    poster={item.thumbnailUrl}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => {
                      // Add your media preview action here
                      console.log(`Previewing media: ${item.id}`);
                    }}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {item.type === 'photo' ? 'View' : 'Play'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 