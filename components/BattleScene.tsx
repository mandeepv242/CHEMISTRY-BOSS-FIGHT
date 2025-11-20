import React from 'react';
import { Boss } from '../types';
import { 
  User, 
  FlaskConical, 
  Zap, 
  Biohazard, 
  Flame, 
  Atom, 
  Ghost,
  Glasses,
  Sword,
  Skull,
  Stethoscope
} from 'lucide-react';

interface BattleSceneProps {
  boss: Boss;
  isHit: boolean;
  isAttacking: boolean;
  isPlayerHit: boolean;
}

const BattleScene: React.FC<BattleSceneProps> = ({ boss, isHit, isAttacking, isPlayerHit }) => {
  
  const getBossIcon = () => {
    // Responsive sizing class handled by parent/container logic or Tailwind classes below
    const className = `w-20 h-20 md:w-32 md:h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${boss.color}`;
    
    switch (boss.icon) {
      case 'flask': return <FlaskConical className={className} />;
      case 'zap': return <Zap className={className} />;
      case 'biohazard': return <Biohazard className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'atom': return <Atom className={className} />;
      default: return <Ghost className={className} />;
    }
  };

  return (
    <div className="relative w-full max-w-4xl h-[25vh] md:h-[35vh] min-h-[180px] flex justify-between items-center px-4 md:px-20 overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm transition-all">
       
       {/* Background Elements */}
       <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-1/4 animate-pulse"><Atom size={40}/></div>
          <div className="absolute bottom-4 right-1/4 animate-bounce"><FlaskConical size={40}/></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-3xl rounded-full"></div>
       </div>

       {/* PLAYER SIDE (Left) */}
       <div className={`relative flex flex-col items-center transition-transform duration-200 z-10 ${isPlayerHit ? 'shake-anim text-red-500' : 'text-cyan-400 float-anim'}`}>
          {/* Lab Coat Avatar */}
          <div className="relative group scale-75 md:scale-100 origin-center">
            {/* Aura */}
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full scale-75 group-hover:scale-100 transition-transform"></div>
            
            {/* Body */}
            <div className="relative bg-slate-900 rounded-full p-2 border-2 border-cyan-500/30">
                 <User size={80} strokeWidth={1.5} className="fill-slate-800 text-white md:w-24 md:h-24"/>
                 {/* Lab Coat Overlay Effect (Stylized) */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-white/10 rounded-b-full blur-sm"></div>
            </div>

            {/* Accessories */}
            <Glasses size={30} className="absolute top-5 left-1/2 -translate-x-1/2 text-cyan-200 drop-shadow-lg" strokeWidth={2.5} />
            <Stethoscope size={24} className="absolute bottom-2 right-0 text-gray-300 rotate-12 drop-shadow-md" />
          </div>
          
          <div className="mt-2 font-bold bg-slate-900/90 px-3 py-0.5 rounded-full border border-cyan-500/50 text-xs md:text-sm tracking-wider shadow-lg">
             STUDENT
          </div>
          
          {/* Player Attack Projectile */}
          {isHit && (
            <div className="absolute top-10 left-10 animate-projectile-right z-20 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
               <Sword size={40} className="text-yellow-400 rotate-90 fill-yellow-200" />
            </div>
          )}
       </div>

       {/* VS FLASH */}
       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 font-black text-5xl md:text-8xl italic pointer-events-none select-none text-white">
          VS
       </div>

       {/* BOSS SIDE (Right) */}
       <div className={`relative flex flex-col items-center transition-transform duration-100 z-10 ${isHit ? 'hit-flash-anim scale-95' : 'float-anim-delayed'} ${isAttacking ? 'scale-110' : ''}`}>
          {/* Boss Icon Container */}
          <div className={`relative p-4 md:p-6 bg-slate-900/80 rounded-full border-4 border-double ${boss.color.replace('text-', 'border-')} shadow-2xl scale-75 md:scale-100`}>
             {getBossIcon()}
             {/* Evil Eyes Effect for Boss */}
             <div className="absolute top-1/3 left-1/3 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse blur-[1px]"></div>
             <div className="absolute top-1/3 right-1/3 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse blur-[1px]"></div>
          </div>
          
          <div className={`mt-2 font-bold bg-slate-900/90 px-3 py-0.5 rounded-full border text-xs md:text-sm ${boss.color} border-opacity-50 tracking-wider shadow-lg`}>
            {boss.name}
          </div>

          {/* Boss Attack Projectile */}
          {isAttacking && (
             <div className="absolute top-10 right-10 animate-projectile-left z-20 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                <Skull size={40} className="text-red-500 fill-red-900" />
             </div>
          )}

          {/* Damage Text */}
          {isHit && (
             <div className="absolute -top-8 right-0 text-yellow-400 font-black text-2xl md:text-4xl animate-bounce drop-shadow-lg whitespace-nowrap" style={{textShadow: '2px 2px 0px #000'}}>
               CRITICAL!
             </div>
          )}
       </div>

       <style>{`
         @keyframes projectile-right {
            0% { transform: translateX(0) rotate(90deg) scale(0.5); opacity: 0; }
            20% { opacity: 1; transform: translateX(30px) rotate(90deg) scale(1); }
            100% { transform: translateX(250px) rotate(180deg) scale(1.5); opacity: 0; }
         }
         @keyframes projectile-left {
            0% { transform: translateX(0) rotate(0deg) scale(0.5); opacity: 0; }
            20% { opacity: 1; transform: translateX(-30px) rotate(0deg) scale(1); }
            100% { transform: translateX(-250px) rotate(-180deg) scale(1.5); opacity: 0; }
         }
         .animate-projectile-right { animation: projectile-right 0.4s ease-in forwards; }
         .animate-projectile-left { animation: projectile-left 0.4s ease-in forwards; }
         .float-anim-delayed { animation: float 3s ease-in-out 1.5s infinite; }
       `}</style>
    </div>
  );
};

export default BattleScene;