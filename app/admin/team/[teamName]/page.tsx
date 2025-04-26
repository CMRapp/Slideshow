'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
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

export default function TeamMediaPage() {
  const { teamName } = useParams();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/media/team/${teamName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team media');
        }
        const data = await response.json();
        setMediaItems(data.mediaItems || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load media');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMedia();
  }, [teamName]);

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Are you sure you want to delete this media item?')) return;

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      setMediaItems(prevItems => prevItems.filter(item => item.id !== mediaId));
    } catch (err) {
      console.error('Error deleting media:', err);
      alert('Failed to delete media item');
    }
  };

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

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <p className="text-white">{error}</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin"
            className="flex items-center text-white hover:text-blue-400 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {decodeURIComponent(teamName as string)} Media
          </h1>
        </div>

        {mediaItems.length === 0 ? (
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
            <p className="text-white">No media items found for this team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="relative group bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden aspect-square"
              >
                {item.file_type.startsWith('image/') ? (
                  <Image
                    src={item.file_path}
                    alt={item.file_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <video
                    src={item.file_path}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Delete media"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
} 