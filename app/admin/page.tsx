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

  const handleTeamNameSave = async () => {
    setError(null);
    setSuccess(null);

    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: teamName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team name');
      }

      setSuccess('Team name saved successfully!');
      setTeamName('');
      fetchTeams(); // Refresh the teams list
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save team name');
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
          {/* Slideshow Config Tab */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter team name"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleTeamNameSave}
                  disabled={!teamName.trim()}
                  className="h-[42px] bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>

            <div id="slideshow-options" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Photo Count</label>
                  <input
                    type="number"
                    value={photoCount}
                    onChange={(e) => setPhotoCount(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter photo count"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handlePhotoCountSave}
                    className="h-[42px] bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Video Count</label>
                  <input
                    type="number"
                    value={videoCount}
                    onChange={(e) => setVideoCount(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter video count"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleVideoCountSave}
                    className="h-[42px] bg-yellow-400 text-black py-2 px-4 rounded hover:bg-yellow-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Tab */}
          <div className="space-y-6">
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-red-900/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
              <p className="text-sm text-gray-300 mb-4">
                This action will permanently delete all media files and database records.
                This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAll}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Reset Database
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team}
                  className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                  onClick={() => fetchTeamMedia(team)}
                >
                  <h3 className="font-semibold">{team}</h3>
                </div>
              ))}
            </div>
            {selectedImage && (
              <ImageViewer
                imageUrl={selectedImage}
                onClose={handleCloseViewer}
              />
            )}
          </div>
        </TabbedContainer>
      </div>
    </div>
  );
} 