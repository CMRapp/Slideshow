'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import SidebarLayout from '@/app/components/SidebarLayout';
import { compressFile } from '@/app/utils/compression';
import { Team, ProgressStatus } from '@/app/types/upload';
import { UploadProgress } from '@/app/components/UploadProgress';

class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

interface UploadedItem {
  type: 'photo' | 'video';
  number: number;
}

export default function UploadPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPhotoNumber, setSelectedPhotoNumber] = useState<string>('');
  const [selectedVideoNumber, setSelectedVideoNumber] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [progress, setProgress] = useState<ProgressStatus | null>(null);
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);

  const photoNumbers = useMemo(() => 
    Array.from({ length: photoCount }, (_, i) => i + 1),
    [photoCount]
  );

  const videoNumbers = useMemo(() => 
    Array.from({ length: videoCount }, (_, i) => i + 1),
    [videoCount]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsResponse, photoCountResponse, videoCountResponse] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/photo-count'),
          fetch('/api/video-count')
        ]);

        if (!teamsResponse.ok || !photoCountResponse.ok || !videoCountResponse.ok) {
          throw new UploadError('Failed to fetch initial data');
        }

        const [teamsData, photoData, videoData] = await Promise.all([
          teamsResponse.json(),
          photoCountResponse.json(),
          videoCountResponse.json()
        ]);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setPhotoCount(parseInt(photoData.count || '0', 10));
        setVideoCount(parseInt(videoData.count || '0', 10));
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setProgress({
          stage: 'error',
          currentFile: 'error',
          currentNumber: 0,
          totalFiles: 0,
          error: err instanceof Error ? err.message : 'Failed to load initial data'
        });
      }
    };

    fetchData();
  }, []);

  // Fetch uploaded items on initial load if selectedTeam is set
  useEffect(() => {
    if (selectedTeam) {
      const fetchUploadedItems = async () => {
        try {
          const response = await fetch(`/api/team-items?team=${encodeURIComponent(selectedTeam)}`);
          if (response.ok) {
            const data = await response.json();
            setUploadedItems(data);
          }
        } catch (error) {
          console.error('Failed to fetch team items:', error);
        }
      };
      fetchUploadedItems();
    }
  }, [selectedTeam]);

  const handleUpload = useCallback(async (files: FileList) => {
    if (!selectedTeam) {
      throw new UploadError('Please select a team');
    }

    if (!selectedPhotoNumber && !selectedVideoNumber) {
      throw new UploadError('Please select a photo or video number');
    }

    try {
      const formData = new FormData();
      formData.append('teamName', selectedTeam);
      
      if (selectedPhotoNumber) {
        formData.append('itemType', 'photo');
        formData.append('itemNumber', selectedPhotoNumber);
      } else if (selectedVideoNumber) {
        formData.append('itemType', 'video');
        formData.append('itemNumber', selectedVideoNumber);
      }

      // Calculate total size
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }

      // Process and compress each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setProgress({
          stage: 'compressing',
          currentFile: file.name,
          currentNumber: i + 1,
          totalFiles: files.length,
          currentSize: file.size,
          totalSize: totalSize
        });
        
        try {
          const compressedFile = await compressFile(file, (progress) => {
            setProgress(prev => prev ? {
              ...prev,
              percent: progress
            } : null);
          });
          console.log(`Compressed ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
          formData.append('file', compressedFile);
        } catch {
          throw new UploadError(`Failed to compress ${file.name}`);
        }
      }

      setProgress({
        stage: 'uploading',
        currentFile: 'all files',
        currentNumber: files.length,
        totalFiles: files.length,
        totalSize: totalSize,
        percent: 0
      });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(prev => prev ? {
            ...prev,
            percent
          } : null);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress({
            stage: 'success',
            currentFile: 'finalizing',
            currentNumber: files.length,
            totalFiles: files.length,
            totalSize: totalSize,
            percent: 100
          });
          // Refresh uploaded items in the background
          if (selectedTeam) {
            try {
              const response = await fetch(`/api/team-items?team=${encodeURIComponent(selectedTeam)}`);
              if (response.ok) {
                const data = await response.json();
                setUploadedItems(data);
              }
            } catch (error) {
              console.error('Failed to refresh uploaded items:', error);
            }
          }
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setProgress({
            stage: 'error',
            currentFile: 'error',
            currentNumber: files.length,
            totalFiles: files.length,
            totalSize: totalSize,
            error: errorData.error || 'Upload failed'
          });
        }
      };

      xhr.onerror = () => {
        setProgress({
          stage: 'error',
          currentFile: 'error',
          currentNumber: files.length,
          totalFiles: files.length,
          totalSize: totalSize,
          error: 'Network error occurred during upload'
        });
      };

      xhr.send(formData);
    } catch (err) {
      console.error('Upload error:', err);
      setProgress({
        stage: 'error',
        currentFile: 'error',
        currentNumber: 0,
        totalFiles: 0,
        error: err instanceof Error ? err.message : 'Failed to upload files. Please try again.'
      });
    }
  }, [selectedTeam, selectedPhotoNumber, selectedVideoNumber]);

  const handleDismissProgress = useCallback(() => {
    setProgress(null);
  }, []);

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

  const handleTeamChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamName = e.target.value;
    setSelectedTeam(teamName);
    setSelectedPhotoNumber('');
    setSelectedVideoNumber('');
    setUploadedItems([]);

    if (teamName) {
      try {
        const response = await fetch(`/api/team-items?team=${encodeURIComponent(teamName)}`);
        if (response.ok) {
          const data = await response.json();
          setUploadedItems(data);
        }
      } catch (error) {
        console.error('Failed to fetch team items:', error);
      }
    }
  };

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
      item => item.type === type && item.number === number
    );
  };

  return (
    <SidebarLayout>
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Upload Media</h1>
          
          <div id="upload-info" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1">
              <label htmlFor="teamSelect" className="block text-white mb-2">
                Team Name
              </label>
              <select
                id="teamSelect"
                value={selectedTeam}
                onChange={handleTeamChange}
                className="w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500"
                required
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
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
                className="w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500 [&>option:disabled]:text-gray-500 [&>option:disabled]:cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select a photo number</option>
                {photoNumbers.map((number) => (
                  <option 
                    key={number} 
                    value={number.toString()}
                    disabled={isItemUploaded('photo', number)}
                  >
                    Photo {number} {isItemUploaded('photo', number) ? '(Uploaded)' : ''}
                  </option>
                ))}
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
                className="w-full px-4 py-2 rounded-lg bg-black/85 border border-white/20 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-all duration-200 [&>option]:bg-black [&>option]:text-white [&>option:hover]:bg-yellow-500 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-yellow-500 [&>option:disabled]:text-gray-500 [&>option:disabled]:cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select a video number</option>
                {videoNumbers.map((number) => (
                  <option 
                    key={number} 
                    value={number.toString()}
                    disabled={isItemUploaded('video', number)}
                  >
                    Video {number} {isItemUploaded('video', number) ? '(Uploaded)' : ''}
                  </option>
                ))}
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
                Supported formats: Images (JPEG, PNG, GIF) and Videos (MP4, WebM, MOV, HEVC)
              </p>
              <p className="text-sm text-gray-400">
                Maximum file size: 4.5MB
              </p>
            </div>
          </div>

          {progress && <UploadProgress progress={progress} onDismiss={handleDismissProgress} />}
        </div>
      </div>
    </SidebarLayout>
  );
}