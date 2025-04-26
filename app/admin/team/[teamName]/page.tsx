'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface MediaItem {
  id: number;
  team_name: string;
  file_type: string;
  file_path: string;
  file_name: string;
  item_type?: string;
  item_number?: number;
}

export default function TeamMediaPage({ params }: { params: { teamName: string } }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/media');
        if (!response.ok) throw new Error('Failed to fetch media');
        
        const data = await response.json();
        const teamMedia = data.mediaItems.filter((item: MediaItem) => 
          item.team_name === decodeURIComponent(params.teamName)
        );
        
        setMediaItems(teamMedia);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load media');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMedia();
  }, [params.teamName]);

  const photos = mediaItems.filter(item => item.file_type.startsWith('image/'));
  const videos = mediaItems.filter(item => item.file_type.startsWith('video/'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link 
          href="/admin/review" 
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8"
        >
          <FiArrowLeft /> Back to Review
        </Link>

        <h1 className="text-3xl font-bold mb-8">
          Team {decodeURIComponent(params.teamName)}
        </h1>

        {/* Photos Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Team Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden">
                  <Image
                    src={photo.file_path}
                    alt={`${photo.team_name} - ${photo.item_type} ${photo.item_number}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm">
                  {photo.item_type} {photo.item_number}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Videos Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Team Videos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-800">
                  <video
                    src={video.file_path}
                    className="w-full h-full object-cover"
                    poster="/video-thumbnail-placeholder.png"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm">
                  {video.item_type} {video.item_number}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 