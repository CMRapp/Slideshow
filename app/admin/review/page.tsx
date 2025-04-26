import Link from 'next/link';

const teamStats = [
  { team_name: 'Team A', photo_count: 10, video_count: 5 },
  { team_name: 'Team B', photo_count: 8, video_count: 3 },
  { team_name: 'Team C', photo_count: 12, video_count: 7 },
  { team_name: 'Team D', photo_count: 9, video_count: 4 },
  { team_name: 'Team E', photo_count: 15, video_count: 10 },
];

return (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Media Review</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamStats.map((team) => (
          <Link 
            key={team.team_name} 
            href={`/admin/team/${encodeURIComponent(team.team_name)}`}
            className="block"
          >
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
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
          </Link>
        ))}
      </div>
    </div>
  </div>
); 