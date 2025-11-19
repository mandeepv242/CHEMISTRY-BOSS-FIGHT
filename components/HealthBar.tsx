import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  color: string;
  isRightAligned?: boolean;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, label, color, isRightAligned = false }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className={`w-full max-w-md ${isRightAligned ? 'text-right' : 'text-left'} mb-2`}>
      <div className="flex justify-between items-end mb-1 boss-font uppercase tracking-widest">
        <span className={`text-lg font-bold ${color} drop-shadow-glow`}>{label}</span>
        <span className="text-sm text-slate-400">{current}/{max} HP</span>
      </div>
      <div className="h-6 bg-slate-800 rounded-sm border-2 border-slate-600 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px'}}>
        </div>
        
        {/* Fill */}
        <div 
          className={`h-full transition-all duration-500 ease-out ${percentage < 20 ? 'bg-red-600 animate-pulse' : isRightAligned ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%`, float: isRightAligned ? 'right' : 'left' }}
        />
      </div>
    </div>
  );
};

export default HealthBar;