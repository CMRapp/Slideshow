'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiCheck, FiX, FiClock } from 'react-icons/fi';
import SidebarLayout from '@/app/components/SidebarLayout';

interface Team {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  lastUpdated: string;
}

export default function ReviewPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data.teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleStatusChange = async (teamId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/teams/${teamId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team status');
      }

      setTeams(teams.map(team => 
        team.id === teamId 
          ? { ...team, status: newStatus, lastUpdated: new Date().toISOString() }
          : team
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team status');
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-white">Loading teams...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-[100dvh]">
          <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <p className="text-white">{error}</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Team Review</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teams.map((team) => (
            <div 
              key={team.id}
              className="glass-effect p-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FiUsers className="text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  team.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  team.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {team.status}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-400 mb-4">
                <FiClock className="mr-2" />
                <span>Last updated: {new Date(team.lastUpdated).toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange(team.id, 'approved')}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  disabled={team.status === 'approved'}
                >
                  <FiCheck />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleStatusChange(team.id, 'rejected')}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  disabled={team.status === 'rejected'}
                >
                  <FiX />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
} 