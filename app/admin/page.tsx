'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiLogOut, FiUpload, FiTrash2 } from 'react-icons/fi';
import TabbedContainer from '../components/admin/TabbedContainer';
import ImageViewer from '../components/ImageViewer';

interface MediaItem {
  id: number;
  file_name: string;
  file_type: string;
  file_path: string;
  item_number: number;
  item_type: string;
  exists: boolean;
  team: string;
  created_at: string;
}

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
  const [mainLogo, setMainLogo] = useState<File | null>(null);
  const [sideLogo, setSideLogo] = useState<File | null>(null);
  const [horizontalLogo, setHorizontalLogo] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>('');
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamMedia, setTeamMedia] = useState<MediaItem[]>([]);
  const [newTeam, setNewTeam] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/check-auth');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleLogoUpload = async (type: 'main' | 'side' | 'horizontal' | 'background') => {
    setError(null);
    setSuccess(null);

    const file = type === 'main' ? mainLogo : type === 'side' ? sideLogo : type === 'horizontal' ? horizontalLogo : backgroundImage;
    if (!file) {
      setError(`Please select a ${type} logo file`);
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Logo upload failed');
      }

      setSuccess(`${type} logo uploaded successfully!`);
      if (type === 'main') setMainLogo(null);
      else if (type === 'side') setSideLogo(null);
      else if (type === 'horizontal') setHorizontalLogo(null);
      else setBackgroundImage(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logo upload failed');
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
      const response = await fetch('/api/save-team-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team name');
      }

      setSuccess('Team name saved successfully!');
      setTeamName('');
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

  const fetchTeamMedia = async (team: string) => {
    try {
      const response = await fetch(`/api/team-media?team=${encodeURIComponent(team)}`);
      if (!response.ok) throw new Error('Failed to fetch team media');
      const data = await response.json();
      setTeamMedia(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching team media:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.trim()) {
      setError('Please enter a team name');
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTeam.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team');
      }

      setSuccess('Team added successfully!');
      setNewTeam('');
      fetchTeams();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add team');
    }
  };

  const handleImageClick = (filePath: string) => {
    setSelectedImage(filePath);
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackgroundImage(URL.createObjectURL(file));
    await handleLogoUpload('background');
  };

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

        <TabbedContainer
          tabs={[
            {
              id: 'upload',
              label: 'Upload Media',
              content: (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">File</label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <button
                    onClick={handleFileUpload}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                  >
                    <FiUpload />
                    Upload
                  </button>
                </div>
              ),
            },
            {
              id: 'settings',
              label: 'Settings',
              content: (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Photo Count</label>
                    <input
                      type="number"
                      value={photoCount}
                      onChange={(e) => setPhotoCount(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={handlePhotoCountSave}
                      className="mt-2 w-full px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                    >
                      Save Photo Count
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Video Count</label>
                    <input
                      type="number"
                      value={videoCount}
                      onChange={(e) => setVideoCount(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={handleVideoCountSave}
                      className="mt-2 w-full px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                    >
                      Save Video Count
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Main Logo</label>
                    <input
                      type="file"
                      onChange={(e) => setMainLogo(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={() => handleLogoUpload('main')}
                      className="mt-2 w-full px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                    >
                      Upload Main Logo
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Side Logo</label>
                    <input
                      type="file"
                      onChange={(e) => setSideLogo(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={() => handleLogoUpload('side')}
                      className="mt-2 w-full px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                    >
                      Upload Side Logo
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Horizontal Logo</label>
                    <input
                      type="file"
                      onChange={(e) => setHorizontalLogo(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      onClick={() => handleLogoUpload('horizontal')}
                      className="mt-2 w-full px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                    >
                      Upload Horizontal Logo
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Background Image</label>
                    <input
                      type="file"
                      onChange={handleBackgroundUpload}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    {backgroundImage && (
                      <div className="mt-4 relative aspect-video">
                        <Image
                          src={backgroundImage}
                          alt="Background preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDeleteAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <FiTrash2 />
                    Delete All Media
                  </button>
                </div>
              ),
            },
            {
              id: 'teams',
              label: 'Teams',
              content: (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">New Team</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeam}
                        onChange={(e) => setNewTeam(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        onClick={handleAddTeam}
                        className="px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors"
                      >
                        Add Team
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Select Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTeam && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {teamMedia.map((item) => (
                        <div
                          key={item.id}
                          className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => handleImageClick(item.file_path)}
                        >
                          {item.file_type.startsWith('image/') ? (
                            <Image
                              src={item.file_path}
                              alt={item.file_name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">🎥</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />

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