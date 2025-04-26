'use client';

import { useState, useEffect } from 'react';

interface TeamStats {
  team_name: string;
  photo_count: number;
  video_count: number;
}

export default function ReviewPage() {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/media/stats');
        if (!response.ok) throw new Error('Failed to fetch team stats');
        
        const data = await response.json();
        setTeamStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

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
        <h1 className="text-3xl font-bold mb-8">Media Review</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamStats.map((team) => (
            <div 
              key={team.team_name}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-4">{team.team_name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-400">Photos</div>
                  <div className="text-2xl font-bold">{team.photo_count}</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-400">Videos</div>
                  <div className="text-2xl font-bold">{team.video_count}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 