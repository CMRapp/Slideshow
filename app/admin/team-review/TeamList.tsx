'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiImage, FiVideo } from 'react-icons/fi';

interface Team {
  id: number;
  name: string;
  photo_count: number;
  video_count: number;
}

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-900 text-white rounded-lg">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Loading teams...
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No teams found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/admin/team-review/${encodeURIComponent(team.name)}`}
          className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold mb-4">{team.name}</h2>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <FiImage />
              <span>{team.photo_count} Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <FiVideo />
              <span>{team.video_count} Videos</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 