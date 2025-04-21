'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiUpload, FiTrash2, FiEye, FiX } from 'react-icons/fi';
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mainLogo, setMainLogo] = useState<File | null>(null);
  const [sideLogo, setSideLogo] = useState<File | null>(null);
  const [horizontalLogo, setHorizontalLogo] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamMedia, setTeamMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'review'>('teams');
  const [newTeam, setNewTeam] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/check-auth');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      document.cookie = `auth-token=${data.token}; path=/; secure; samesite=strict`;
      setIsAuthenticated(true);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

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
      setTeams([]);
    }
  };

  const fetchTeamMedia = async (team: string) => {
    try {
      console.log('Fetching media for team:', team);
      const response = await fetch(`/api/team-media?team=${encodeURIComponent(team)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Team media API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to fetch team media');
      }
      
      const data = await response.json();
      console.log('Team media response:', data);
      
      if (!data.media) {
        console.warn('No media data in response');
        setTeamMedia([]);
        return;
      }
      
      setTeamMedia(data.media);
    } catch (error) {
      console.error('Error fetching team media:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch team media');
      setTeamMedia([]);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMedia(selectedTeam);
    } else {
      setTeamMedia([]);
    }
  }, [selectedTeam]);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.trim()) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTeam.trim() }),
      });

      if (!response.ok) throw new Error('Failed to add team');
      
      setNewTeam('');
      fetchTeams();
    } catch (err) {
      console.error('Error adding team:', err);
      setError('Failed to add team');
    }
  };

  const handleImageClick = (filePath: string) => {
    console.log('Clicked image path:', filePath);
    const formattedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    console.log('Formatted image path:', formattedPath);
    setSelectedImage(formattedPath);
  };

  const handleCloseViewer = () => {
    console.log('Closing image viewer');
    setSelectedImage(null);
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload background image');
      }

      const data = await response.json();
      setBackgroundImage(data.filePath);
    } catch (error) {
      console.error('Error uploading background:', error);
      alert('Failed to upload background image');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 rounded-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Admin Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
          >
            <FiLogOut />
            <span>Logout</span>
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

        <div className="bg-black/85 rounded-lg overflow-hidden h-[calc(100vh-12rem)] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.5)] shadow-[0_0_30px_rgba(255,255,255,0.3)] shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <TabbedContainer>
            {/* Slideshow Config Tab */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Slideshow Configuration</h2>
              <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Team Name</h3>
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter team name"
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                      <button
                        onClick={handleTeamNameSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                      >
                        <FiUpload />
                        <span>Save Team Name</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Photo Count</h3>
                    <p className="text-gray-300 mb-4">Enter the amount of photo items to be uploaded per team for this slideshow</p>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={photoCount}
                        onChange={(e) => setPhotoCount(Number(e.target.value))}
                        min="0"
                        placeholder="Enter number of photos"
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                      <button
                        onClick={handlePhotoCountSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                      >
                        <FiUpload />
                        <span>Save Photo Count</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Video Count</h3>
                    <p className="text-gray-300 mb-4">Enter the amount of video items to be uploaded per team for this slideshow</p>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={videoCount}
                        onChange={(e) => setVideoCount(Number(e.target.value))}
                        min="0"
                        placeholder="Enter number of videos"
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                      <button
                        onClick={handleVideoCountSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                      >
                        <FiUpload />
                        <span>Save Video Count</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Branding Tab */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Branding</h2>
              <div className="space-y-6">
                {/* Background Image Upload */}
                <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Background Image</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="text-white"
                    />
                    <button
                      onClick={() => handleLogoUpload('background')}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      <FiUpload />
                      <span>Upload Background</span>
                    </button>
                  </div>
                  {backgroundImage && (
                    <div className="mt-4">
                      <img
                        src={backgroundImage}
                        alt="Background Preview"
                        className="max-w-full h-auto rounded shadow"
                      />
                    </div>
                  )}
                </div>

                {/* Main Logo Upload */}
                <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Main Logo</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMainLogo(e.target.files?.[0] || null)}
                      className="text-white"
                    />
                    <button
                      onClick={() => handleLogoUpload('main')}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      <FiUpload />
                      <span>Upload Main Logo</span>
                    </button>
                  </div>
                </div>

                {/* Side Logo Upload */}
                <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Side Logo</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSideLogo(e.target.files?.[0] || null)}
                      className="text-white"
                    />
                    <button
                      onClick={() => handleLogoUpload('side')}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      <FiUpload />
                      <span>Upload Side Logo</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Logo Upload */}
                <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Horizontal Logo</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setHorizontalLogo(e.target.files?.[0] || null)}
                      className="text-white"
                    />
                    <button
                      onClick={() => handleLogoUpload('horizontal')}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      <FiUpload />
                      <span>Upload Horizontal Logo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Management Tab */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Database Management</h2>
              <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">Reset Database</h3>
                      <p className="text-gray-300">Reset the database clearing all data</p>
                    </div>
                    <button
                      onClick={handleDeleteAll}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      <FiTrash2 />
                      <span>Reset Database</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Tab */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Review Uploads</h2>
              <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                <div className="space-y-6">
                  {/* Team Selection */}
                  <div>
                    <label htmlFor="teamSelect" className="block text-sm font-medium text-white mb-2">
                      Select Team
                    </label>
                    <select
                      id="teamSelect"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media Display */}
                  {selectedTeam && (
                    <div className="space-y-6">
                      {/* Photos Section */}
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Photos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {teamMedia
                            .filter((item) => item.item_type === 'photo')
                            .map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  console.log('Clicked photo:', item.file_path);
                                  const formattedPath = item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`;
                                  setSelectedImage(formattedPath);
                                }}
                                className="relative cursor-pointer group"
                              >
                                {item.exists ? (
                                  <img
                                    src={item.file_path}
                                    alt={`Photo ${item.item_number}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      console.error('Error loading image:', item.file_path);
                                      e.currentTarget.src = '/placeholder.jpg';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">File not found</span>
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg">
                                  <p className="text-white text-sm">Photo #{item.item_number}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Videos Section */}
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Videos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {teamMedia
                            .filter((item) => item.item_type === 'video')
                            .map((item) => (
                              <div
                                key={item.id}
                                onClick={() => {
                                  console.log('Clicked video:', item.file_path);
                                  const formattedPath = item.file_path.startsWith('/') ? item.file_path : `/${item.file_path}`;
                                  setSelectedImage(formattedPath);
                                }}
                                className="relative cursor-pointer group"
                              >
                                {item.exists ? (
                                  <video
                                    src={item.file_path}
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      console.error('Error loading video:', item.file_path);
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">File not found</span>
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg">
                                  <p className="text-white text-sm">Video #{item.item_number}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Viewer Modal */}
                  {selectedImage && (
                    <div className="fixed inset-0 z-50">
                      <ImageViewer
                        imageUrl={selectedImage}
                        onClose={() => {
                          console.log('Closing image viewer');
                          setSelectedImage(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Media Tab */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Upload Media</h2>
              <div className="bg-black/85 p-6 rounded-lg border border-white/10">
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div>
                    <label htmlFor="fileInput" className="block text-sm font-medium text-white mb-2">
                      Select File
                    </label>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
                  >
                    <FiUpload />
                    <span>Upload Media</span>
                  </button>
                </form>
              </div>
            </div>
          </TabbedContainer>
        </div>
      </div>
    </div>
  );
} 