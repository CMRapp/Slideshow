'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import TabbedContainer from '../components/admin/TabbedContainer';
import ImageViewer from '../components/ImageViewer';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('teamName', teamName.trim());
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setSuccess('File uploaded successfully!');
      setTeamName('');
      setSelectedFile(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all media? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      setSuccess('All media deleted successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete media');
    }
  };

  const handlePhotoCountSave = async () => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/photo-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: photoCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save photo count');
      }

      setSuccess('Photo count saved successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save photo count');
    }
  };

  const handleVideoCountSave = async () => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/video-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: videoCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save video count');
      }

      setSuccess('Video count saved successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save video count');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const fetchTeamMedia = async (team: string) => {
    try {
      const response = await fetch(`/api/team-media?team=${encodeURIComponent(team)}`);
      if (!response.ok) throw new Error('Failed to fetch team media');
      const data = await response.json();
      setSelectedImage(data[0]?.file_path || null);
    } catch (error) {
      console.error('Error fetching team media:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FiLogOut />
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 text-white rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900 text-white rounded-lg">
            {success}
          </div>
        )}

        <TabbedContainer>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                placeholder="Enter team name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Upload Media</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                accept="image/*,video/*"
              />
            </div>
            <button
              onClick={handleFileUpload}
              disabled={!teamName || !selectedFile}
              className="w-full bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Photo Count</label>
              <input
                type="number"
                value={photoCount}
                onChange={(e) => setPhotoCount(parseInt(e.target.value))}
                className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
              />
              <button
                onClick={handlePhotoCountSave}
                className="mt-2 bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500"
              >
                Save Photo Count
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Video Count</label>
              <input
                type="number"
                value={videoCount}
                onChange={(e) => setVideoCount(parseInt(e.target.value))}
                className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
              />
              <button
                onClick={handleVideoCountSave}
                className="mt-2 bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500"
              >
                Save Video Count
              </button>
            </div>
            <button
              onClick={handleDeleteAll}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Delete All Media
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Teams</label>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div key={team} className="flex items-center justify-between">
                    <span>{team}</span>
                    <button
                      onClick={() => fetchTeamMedia(team)}
                      className="bg-yellow-400 text-black py-1 px-3 rounded hover:bg-yellow-500"
                    >
                      View Media
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabbedContainer>

        {selectedImage && (
          <ImageViewer
            imageUrl={selectedImage}
            onClose={handleCloseViewer}
          />
        )}
      </div>
    </div>
  );
} 