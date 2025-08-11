import { useAuth } from '../../contexts/AuthContext';

function ProfilePage() {
  const { user, loading } = useAuth();
  const getRank = (elo) => {
    if (!elo) return '';
    if (elo < 1000) return 'Pirate King';
    if (elo < 1200) return 'Admiral';
    if (elo < 1400) return 'Yonko Commander+';
    if (elo < 1600) return 'Shanks';
    if (elo < 1800) return 'Mihawk';
    return 'Buggy';
  };

  // Get rank color based on rank
  const getRankColor = (rank) => {
    switch(rank) {
      case 'Pirate King': return 'gray';
      case 'Admiral': return '#2016edff';
      case 'Yonko Commander+': return '#e90ff1ff';
      case 'Shanks': return '#ff0606ff';
      case 'Mihawk': return '#4ade80';
      case 'Buggy': return '#ffffffff';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#2f3136] text-white">
        <div className="w-10 h-10 border-4 border-[#60a7b1] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading user info...</p>
      </div>
    );
  }

  const userRank = user ? getRank(user.elo) : 'Unranked';
  const rankColor = getRankColor(userRank);

  return (
    <div className="bg-[#2f3136] text-white p-6 md:p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <span className="inline-block mr-3">👤</span>
        Profile
      </h1>
      
      {!user ? (
        <div className="bg-[#3f4147] p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg mb-4">Please log in to view your profile.</p>
          <a href="/login" className="inline-block bg-[#60a7b1] hover:bg-[#70b7b9] text-white px-6 py-2 rounded transition-colors">
            Login
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-[#3f4147] p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">{user.username}</h2>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Email:</span> {user.email}</p>
                  <p>
                    <span className="text-gray-400">Current ELO:</span>
                    <span className="text-[#60a7b1] font-bold ml-2">{user.elo}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Rank:</span>
                    <span className="ml-2 font-semibold" style={{color: rankColor}}>{userRank}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Match Statistics Placeholder */}
            <div className="bg-[#3f4147] p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[#4e5058]">Match Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2f3136] p-4 rounded text-center">
                  <p className="text-2xl font-bold text-[#60a7b1]">--</p>
                  <p className="text-sm text-gray-400">Total Games</p>
                </div>
                <div className="bg-[#2f3136] p-4 rounded text-center">
                  <p className="text-2xl font-bold text-green-400">--</p>
                  <p className="text-sm text-gray-400">Wins</p>
                </div>
                <div className="bg-[#2f3136] p-4 rounded text-center">
                  <p className="text-2xl font-bold text-red-400">--</p>
                  <p className="text-sm text-gray-400">Losses</p>
                </div>
                <div className="bg-[#2f3136] p-4 rounded text-center">
                  <p className="text-2xl font-bold text-[#60a7b1]">--%</p>
                  <p className="text-sm text-gray-400">Win Rate</p>
                </div>
              </div>
              <p className="text-center mt-4 text-gray-400 text-sm italic">Statistics coming soon</p>
            </div>
            
            {/* Recent Matches Placeholder */}
            <div className="bg-[#3f4147] p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[#4e5058]">Recent Matches</h2>
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>Match history coming soon</p>
              </div>
            </div>
          </div>
          
          {/* ELO Chart Placeholder */}
          <div className="bg-[#3f4147] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-[#4e5058]">ELO Progression</h2>
            <div className="flex flex-col items-center justify-center h-60 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>ELO progression chart coming soon</p>
              <p className="text-sm mt-1">When match history is available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;