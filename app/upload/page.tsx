'use client';

import { useState, useCallback, useEffect } from 'react';
import SidebarLayout from '@/app/components/SidebarLayout';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [selectedPhotoNumber, setSelectedPhotoNumber] = useState('');
  const [selectedVideoNumber, setSelectedVideoNumber] = useState('');
  const [uploadedItems, setUploadedItems] = useState<{ item_type: string; item_number: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPhotoCount = async () => {
      try {
        const response = await fetch('/api/photo-count');
        if (response.ok) {
          const data = await response.json();
          const count = parseInt(data.count || '0', 10);
          setPhotoCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch photo count:', error);
        setPhotoCount(0);
      }
    };

    const fetchVideoCount = async () => {
      try {
        const response = await fetch('/api/video-count');
        if (response.ok) {
          const data = await response.json();
          const count = parseInt(data.count || '0', 10);
          setVideoCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch video count:', error);
        setVideoCount(0);
      }
    };

    fetchTeams();
    fetchPhotoCount();
    fetchVideoCount();
  }, []);

  useEffect(() => {
    const fetchUploadedItems = async () => {
      if (!selectedTeam) return;
      
      try {
        const response = await fetch(`/api/uploaded-items?teamName=${encodeURIComponent(selectedTeam)}`);
        if (response.ok) {
          const data = await response.json();
          setUploadedItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch uploaded items:', error);
        setUploadedItems([]);
      }
    };

    fetchUploadedItems();
  }, [selectedTeam]);

  const handleUpload = useCallback(async (files: FileList) => {
    if (!selectedTeam) {
      setUploadStatus({ 
        success: false, 
        message: 'Please select a team' 
      });
      return;
    }

    if (!selectedPhotoNumber && !selectedVideoNumber) {
      setUploadStatus({ 
        success: false, 
        message: 'Please select a photo or video number' 
      });
      return;
    }

    const formData = new FormData();
    formData.append('team', selectedTeam);
    if (selectedPhotoNumber) {
      formData.append('itemType', 'photo');
      formData.append('itemNumber', selectedPhotoNumber);
    } else if (selectedVideoNumber) {
      formData.append('itemType', 'video');
      formData.append('itemNumber', selectedVideoNumber);
    }
    Array.from(files).forEach((file) => {
      formData.append('file', file);
    });

    try {
      setUploadStatus({ success: true, message: 'Uploading files...' });
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      if (!data || !data.success) {
        throw new Error('Upload failed');
      }

      // Refresh uploaded items after successful upload
      const itemsResponse = await fetch(`/api/uploaded-items?teamName=${encodeURIComponent(selectedTeam)}`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setUploadedItems(itemsData.items || []);
      }

      setUploadStatus({ 
        success: true, 
        message: `Successfully uploaded file for Team ${selectedTeam}` 
      });
      
      // Clear selections
      setSelectedPhotoNumber('');
      setSelectedVideoNumber('');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  }, [selectedTeam, selectedPhotoNumber, selectedVideoNumber]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, [handleUpload]);

  const handlePhotoNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPhotoNumber(e.target.value);
    if (e.target.value) {
      setSelectedVideoNumber('');
    }
  };

  const handleVideoNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVideoNumber(e.target.value);
    if (e.target.value) {
      setSelectedPhotoNumber('');
    }
  };

  const isItemUploaded = (type: 'photo' | 'video', number: number) => {
    return uploadedItems.some(
      item => item.item_type === type && item.item_number === number
    );
  };

  return (
    <SidebarLayout>
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Upload Media</h1>
          
          <div id="upload-info" className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-1">
              <label htmlFor="teamSelect" className="block text-white mb-2">
                Team Name
              </label>
              {isLoading ? (
                <div className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white">
                  No teams available. Please add teams in the admin panel.
                </div>
              ) : (
                <select
                  id="teamSelect"
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setSelectedPhotoNumber('');
                    setSelectedVideoNumber('');
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-span-1">
              <label htmlFor="photoNumberSelect" className="block text-white mb-2">
                Photo Number
              </label>
              <select
                id="photoNumberSelect"
                value={selectedPhotoNumber}
                onChange={handlePhotoNumberChange}
                disabled={!!selectedVideoNumber}
                className={`w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500 ${
                  !!selectedVideoNumber ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">Select photo number</option>
                {Array.from({ length: photoCount }, (_, i) => {
                  const number = i + 1;
                  const isUploaded = isItemUploaded('photo', number);
                  return (
                    <option 
                      key={number} 
                      value={number}
                      disabled={isUploaded}
                      className={isUploaded ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Photo #{number} {isUploaded ? '(Uploaded)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="col-span-1">
              <label htmlFor="videoNumberSelect" className="block text-white mb-2">
                Video Number
              </label>
              <select
                id="videoNumberSelect"
                value={selectedVideoNumber}
                onChange={handleVideoNumberChange}
                disabled={!!selectedPhotoNumber}
                className={`w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500 ${
                  !!selectedPhotoNumber ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">Select video number</option>
                {Array.from({ length: videoCount }, (_, i) => {
                  const number = i + 1;
                  const isUploaded = isItemUploaded('video', number);
                  return (
                    <option 
                      key={number} 
                      value={number}
                      disabled={isUploaded}
                      className={isUploaded ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Video #{number} {isUploaded ? '(Uploaded)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                Drag and drop your files here, or
              </p>
              <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors">
                Select Files
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="text-sm text-gray-400">
                Supported formats: Images (JPEG, PNG, GIF) and Videos (MP4, WebM)
              </p>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mt-4 p-4 rounded ${
              uploadStatus.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}