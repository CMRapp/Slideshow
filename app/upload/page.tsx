'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import SidebarLayout from '@/app/components/SidebarLayout';
import { compressFile } from '@/app/utils/compression';
import { Team, UploadStatus, ProgressStatus } from '@/app/types/upload';
import { UploadProgress } from '@/app/components/UploadProgress';

class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export default function UploadPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPhotoNumber, setSelectedPhotoNumber] = useState<string>('');
  const [selectedVideoNumber, setSelectedVideoNumber] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle', message: '' });
  const [progress, setProgress] = useState<ProgressStatus | null>(null);

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
        setUploadStatus({ 
          status: 'error', 
          message: err instanceof Error ? err.message : 'Failed to load initial data' 
        });
      }
    };

    fetchData();
  }, []);

  const handleUpload = useCallback(async (files: FileList) => {
    if (!selectedTeam) {
      throw new UploadError('Please select a team');
    }

    if (!selectedPhotoNumber && !selectedVideoNumber) {
      throw new UploadError('Please select a photo or video number');
    }

    try {
      const formData = new FormData();
      formData.append('team', selectedTeam);
      
      if (selectedPhotoNumber) {
        formData.append('itemType', 'photo');
        formData.append('itemNumber', selectedPhotoNumber);
      } else if (selectedVideoNumber) {
        formData.append('itemType', 'video');
        formData.append('itemNumber', selectedVideoNumber);
      }

      // Process and compress each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setProgress({
          stage: 'compressing',
          currentFile: file.name,
          currentNumber: i + 1,
          totalFiles: files.length,
        });
        
        try {
          const compressedFile = await compressFile(file);
          console.log(`Compressed ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
          formData.append('file', compressedFile);
        } catch (err) {
          throw new UploadError(`Failed to compress ${file.name}`);
        }
      }

      setProgress({
        stage: 'uploading',
        currentFile: 'all files',
        currentNumber: files.length,
        totalFiles: files.length,
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new UploadError(errorData.error || 'Upload failed');
      }

      setProgress({
        stage: 'processing',
        currentFile: 'finalizing',
        currentNumber: files.length,
        totalFiles: files.length,
      });

      setUploadStatus({ status: 'success', message: 'Upload completed successfully' });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus({ 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Failed to upload files. Please try again.' 
      });
    } finally {
      setProgress(null);
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

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
    setSelectedPhotoNumber('');
    setSelectedVideoNumber('');
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
                  <option key={number} value={number.toString()}>
                    Photo {number}
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
                  <option key={number} value={number.toString()}>
                    Video {number}
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
            </div>
          </div>

          {progress && <UploadProgress progress={progress} />}

          {uploadStatus && (
            <div className={`mt-4 p-4 rounded ${
              uploadStatus.status === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}