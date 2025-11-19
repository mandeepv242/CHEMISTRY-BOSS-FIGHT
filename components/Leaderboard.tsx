import React, { useState, useEffect } from 'react';
import { HighScore } from '../types';
import { Trophy, ArrowLeft } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('chemBossLeaderboard');
    if (saved) {
      setScores(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4 relative z-20">
      <div className="w-full max-w-md bg-slate-800 border-2 border-yellow-500/50 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Trophy className="text-yellow-400 w-10 h-10" />
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            HALL OF FAME
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          {scores.length === 0 ? (
            <p className="text-center text-slate-400 italic">No legends yet. Be the first!</p>
          ) : (
            scores.map((entry, index) => (
              <div key={index} className="flex justify-between items-center bg-slate-700/50 p-4 rounded border border-slate-600">
                <div className="flex items-center gap-4">
                  <span className={`font-bold text-xl w-8 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{index + 1}
                  </span>
                  <span className="font-mono text-lg text-white">{entry.name}</span>
                </div>
                <span className="font-bold text-cyan-400">{entry.score}</span>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={onBack}
          className="w-full py-3 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
        >
          <ArrowLeft size={20} /> BACK TO MENU
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;