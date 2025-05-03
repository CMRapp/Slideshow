'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
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
            onClick={() => router.back()}
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
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          Back
        </button>
      <div className="flex items-center gap-4 mb-8">
        
        <h1 className="text-3xl font-bold">{teamName} Media</h1>
      </div>

      {mediaItems.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No media items found for this team.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-800"
            >
              {item.type === 'photo' ? (
                <Image
                  src={item.url}
                  alt={`${teamName} ${item.type} ${item.number}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                <span className="text-sm text-white">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {item.number}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
} 