'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiX, FiTrash2 } from 'react-icons/fi';
import TabbedContainer from '../components/admin/TabbedContainer';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: number; name: string } | null>(null);
  const [teamName, setTeamName] = useState('');
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [logoUploadStatus, setLogoUploadStatus] = useState<{ status: 'idle' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });

  const loadImage = async (element: HTMLImageElement, url: string) => {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        element.src = URL.createObjectURL(blob);
      } else {
        console.error(`Failed to load image: ${url}`);
      }
    } catch (error) {
      console.error(`Error loading image: ${url}`, error);
    }
  };

  // Initialize logo previews
  useEffect(() => {
    const mainLogo = document.getElementById('logo') as HTMLImageElement;
    const sideLogoVertical = document.getElementById('side-logo') as HTMLImageElement;
    const sideLogoHorizontal = document.getElementById('side-logo') as HTMLImageElement;

    if (mainLogo) {
      loadImage(mainLogo, 'https://public.blob.vercel-storage.com/logos/riders-wm.png');
    }
    if (sideLogoVertical) {
      loadImage(sideLogoVertical, 'https://public.blob.vercel-storage.com/logos/side-logo-vertical.png');
    }
    if (sideLogoHorizontal) {
      loadImage(sideLogoHorizontal, 'https://public.blob.vercel-storage.com/logos/side-logo-horiz.png');
    }
  }, []);

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

  const confirmDeleteAll = async () => {
    try {
      const response = await fetch('/api/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset the database');
      }

      setSuccess('All media deleted successfully');
      setShowDeleteAllConfirm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset the database');
    }
  };

  const handlePhotoCountSave = async () => {
    try {
      const response = await fetch('/api/photo-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: photoCount }),
      });

      if (!response.ok) {
        throw new Error('Failed to save photo count');
      }

      setSuccess('Photo count saved successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save photo count');
    }
  };

  const handleVideoCountSave = async () => {
    try {
      const response = await fetch('/api/video-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: videoCount }),
      });

      if (!response.ok) {
        throw new Error('Failed to save video count');
      }

      setSuccess('Video count saved successfully');
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
      fetchTeams(); // Refresh the teams list
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save team name');
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    setTeamToDelete({ id: teamId, name: teamName });
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      const response = await fetch(`/api/teams?name=${encodeURIComponent(teamToDelete.name)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      setSuccess('Team deleted successfully');
      setTeamToDelete(null);
      fetchTeams(); // Refresh the teams list
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete team');
      setTeamToDelete(null);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: 'main' | 'vertical' | 'horizontal') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoUploadStatus({ status: 'error', message: 'Invalid file type. Please upload a PNG, JPG, or SVG file.' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadStatus({ status: 'error', message: 'File size too large. Maximum size is 5MB.' });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update preview immediately
    const previewElement = document.getElementById(logoType === 'main' ? 'logo' : 'side-logo') as HTMLImageElement;
    if (previewElement) {
      previewElement.src = previewUrl;
    }

    const formData = new FormData();
    formData.append(logoType === 'main' ? 'mainLogo' : logoType === 'vertical' ? 'sideLogoVertical' : 'sideLogoHorizontal', file);

    try {
      const response = await fetch('/api/upload-logos', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      setLogoUploadStatus({ status: 'success', message: 'Logo uploaded successfully!' });
      
      // Force a refresh of the image elements with a timestamp
      const logoElements = document.querySelectorAll(`#${logoType === 'main' ? 'logo' : 'side-logo'}`);
      logoElements.forEach(el => {
        if (el instanceof HTMLImageElement) {
          const baseUrl = `https://public.blob.vercel-storage.com/logos/${
            logoType === 'main' ? 'riders-wm.png' : 
            logoType === 'vertical' ? 'side-logo-vertical.png' : 
            'side-logo-horiz.png'
          }`;
          loadImage(el, `${baseUrl}?t=${new Date().getTime()}`);
        }
      });

      // Clean up the preview URL
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      setLogoUploadStatus({ status: 'error', message: error instanceof Error ? error.message : 'Failed to upload logo' });
      // Revert preview on error
      if (previewElement) {
        const baseUrl = `https://public.blob.vercel-storage.com/logos/${
          logoType === 'main' ? 'riders-wm.png' : 
          logoType === 'vertical' ? 'side-logo-vertical.png' : 
          'side-logo-horiz.png'
        }`;
        loadImage(previewElement, baseUrl);
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Delete All Confirmation Popup */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-lg max-w-md w-full mx-4 border border-white/10 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_20px_rgba(234,179,8,0.20)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reset Database</h3>
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to reset the database? This will permanently delete all media files and database records. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Popup */}
      {teamToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-lg max-w-md w-full mx-4 border border-white/10 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:shadow-[0_0_20px_rgba(234,179,8,0.20)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Team</h3>
              <button
                onClick={() => setTeamToDelete(null)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete the team &quot;{teamToDelete.name}&quot;? This will permanently delete all associated media files and records. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setTeamToDelete(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTeam}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="space-y-6" id="team-info">
            <div className="flex gap-2">
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-2">Team Name Entry</h3>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter A New Team Name"
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

            {/* Team Listing */}
            <div className="mt-4" id="team-listing">
              <h3 className="text-sm font-medium mb-2">Existing Teams</h3>
              {teams.length === 0 ? (
                <p className="text-gray-400">No teams found</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                    >
                      <span className="text-white">{team.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeam(team.id, team.name);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 className="text-sm font-medium mb-2">Set Slideshow Options</h3>
            <div id="slideshow-options" className="grid grid-cols-2 gap-6">
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
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Branding Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Site Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <img id="logo" src="https://public.blob.vercel-storage.com/logos/riders-wm.png" alt="Site Logo" className="max-h-[60px] object-contain" />
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.svg"
                      onChange={(e) => handleLogoUpload(e, 'main')}
                      className="hidden"
                      id="mainLogoInput"
                    />
                    <label
                      htmlFor="mainLogoInput"
                      className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 cursor-pointer"
                    >
                      Upload Logo
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Side Logo (Vertical)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <img id="side-logo" src="https://public.blob.vercel-storage.com/logos/side-logo-vertical.png" alt="Side Logo Vertical" className="max-w-[60px] max-h-[60px] w-auto h-auto object-contain" />
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.svg"
                      onChange={(e) => handleLogoUpload(e, 'vertical')}
                      className="hidden"
                      id="verticalLogoInput"
                    />
                    <label
                      htmlFor="verticalLogoInput"
                      className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 cursor-pointer"
                    >
                      Upload Logo
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Side Logo (Horizontal)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <img id="side-logo" src="https://public.blob.vercel-storage.com/logos/side-logo-horiz.png" alt="Side Logo Horizontal" className="max-h-[60px] object-contain" />
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.svg"
                      onChange={(e) => handleLogoUpload(e, 'horizontal')}
                      className="hidden"
                      id="horizontalLogoInput"
                    />
                    <label
                      htmlFor="horizontalLogoInput"
                      className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 cursor-pointer"
                    >
                      Upload Logo
                    </label>
                  </div>
                </div>

                {logoUploadStatus.status !== 'idle' && (
                  <div className={`p-4 rounded ${
                    logoUploadStatus.status === 'success' ? 'bg-green-900 text-white' : 'bg-red-900 text-white'
                  }`}>
                    {logoUploadStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Database Management Tab */}
          <div className="space-y-6">
            <div className="p-4 bg-red-900/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
              <p className="text-sm text-gray-300 mb-4">
                This action will permanently delete all media files and database records.
                This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Reset Database
              </button>
            </div>
          </div>

          {/* Review Tab */}
          <div className="space-y-6">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-2">Team Review</h3>
              {teams.length === 0 ? (
                <p className="text-gray-400">No teams found</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-600 rounded-lg transition-colors"
                      onClick={() => {
                        console.log(`Reviewing team: ${team.name}`);
                      }}
                    >
                      <span className="text-white">{team.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabbedContainer>
      </div>
    </div>
  );
} 