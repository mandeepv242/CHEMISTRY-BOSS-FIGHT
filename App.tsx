import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameScreen, GameState, Boss, Question, HighScore } from './types';
import { LEVELS } from './constants';
import { audioManager } from './services/audioService';
import HealthBar from './components/HealthBar';
import BattleScene from './components/BattleScene';
import ParticleSystem from './components/ParticleSystem';
import Leaderboard from './components/Leaderboard';
import { 
  Sword, Shield, Zap, Brain, Volume2, VolumeX, Trophy, 
  RotateCcw, Play, ChevronRight, Skull, Timer, Award, Flame 
} from 'lucide-react';

const MAX_PLAYER_HP = 1000;

const App: React.FC = () => {
  // -- State --
  const [gameState, setGameState] = useState<GameState>({
    screen: GameScreen.MENU,
    currentLevelIndex: 0,
    playerHp: MAX_PLAYER_HP,
    maxPlayerHp: MAX_PLAYER_HP,
    bossHp: 0,
    score: 0,
    streak: 0,
    isSoundOn: true,
    remainingQuestions: []
  });

  const [currentBoss, setCurrentBoss] = useState<Boss>(LEVELS[0]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Animation States
  const [bossIsHit, setBossIsHit] = useState(false);
  const [bossIsAttacking, setBossIsAttacking] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [playerDmgOverlay, setPlayerDmgOverlay] = useState(false);
  
  // Particles
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleType, setParticleType] = useState<'hit' | 'spark'>('hit');
  const [clickCoords, setClickCoords] = useState({x: 0, y: 0});

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- Audio Toggle --
  const toggleSound = () => {
    const newState = !gameState.isSoundOn;
    setGameState(prev => ({ ...prev, isSoundOn: newState }));
    audioManager.setEnabled(newState);
  };

  // -- Shuffle Helper --
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // -- Game Logic --

  const startGame = () => {
    audioManager.startMusic();
    audioManager.playClick();
    
    const firstBoss = LEVELS[0];
    // Shuffle all question IDs for this boss
    const allQuestionIds = firstBoss.questions.map(q => q.id);
    const shuffledIds = shuffleArray(allQuestionIds);

    setGameState({
      screen: GameScreen.PLAYING,
      currentLevelIndex: 0,
      playerHp: MAX_PLAYER_HP,
      maxPlayerHp: MAX_PLAYER_HP,
      bossHp: firstBoss.maxHp,
      score: 0,
      streak: 0,
      isSoundOn: gameState.isSoundOn,
      remainingQuestions: shuffledIds
    });
    setCurrentBoss(firstBoss);
    
    // Need a slight delay to allow state to update before picking question
    setTimeout(() => pickNextQuestion(firstBoss, shuffledIds), 100);
  };

  const pickNextQuestion = (boss: Boss, remainingIds: number[]) => {
    let nextIds = [...remainingIds];
    
    // If deck is empty, reshuffle full deck
    if (nextIds.length === 0) {
        const allIds = boss.questions.map(q => q.id);
        nextIds = shuffleArray(allIds);
    }

    const nextId = nextIds.pop();
    const question = boss.questions.find(q => q.id === nextId);
    
    if (question) {
        setCurrentQuestion(question);
        setGameState(prev => ({ ...prev, remainingQuestions: nextIds }));
        setTimeLeft(boss.timeLimit);
    }
  };

  const handleAnswer = (optionIndex: number, e: React.MouseEvent) => {
    if (!currentQuestion) return;

    // Capture click coords for particles
    setClickCoords({ x: e.clientX, y: e.clientY });

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      // -- CORRECT --
      audioManager.playSwordAttack();
      
      // Visuals
      setBossIsHit(true);
      setParticleType('hit');
      setParticleTrigger(prev => prev + 1);
      setTimeout(() => setBossIsHit(false), 500);

      // Calc Damage & Score
      const streakMultiplier = 1 + (gameState.streak * 0.1);
      const damage = Math.round(currentQuestion.damage * streakMultiplier);
      const newBossHp = Math.max(0, gameState.bossHp - damage);
      const timeBonus = Math.ceil(timeLeft * 10);
      const newScore = gameState.score + (100 * streakMultiplier) + timeBonus;

      setGameState(prev => ({
        ...prev,
        bossHp: newBossHp,
        score: Math.round(newScore),
        streak: prev.streak + 1
      }));

      if (newBossHp <= 0) {
        handleLevelComplete();
      } else {
        pickNextQuestion(currentBoss, gameState.remainingQuestions);
      }

    } else {
      // -- WRONG --
      audioManager.playDamage(); // Heavy impact
      audioManager.playError(); // Buzz
      
      // Visuals
      setScreenShake(true);
      setPlayerDmgOverlay(true);
      setBossIsAttacking(true);
      setParticleType('spark');
      setParticleTrigger(prev => prev + 1);
      
      setTimeout(() => {
        setScreenShake(false);
        setPlayerDmgOverlay(false);
        setBossIsAttacking(false);
      }, 500);

      // Damage Player
      const damage = 200; // High damage for mistakes
      const newPlayerHp = Math.max(0, gameState.playerHp - damage);

      setGameState(prev => ({
        ...prev,
        playerHp: newPlayerHp,
        streak: 0
      }));

      if (newPlayerHp <= 0) {
        handleGameOver();
      } else {
        pickNextQuestion(currentBoss, gameState.remainingQuestions);
      }
    }
  };

  // -- Level & Game Flow --

  const handleLevelComplete = () => {
    audioManager.playVictoryJingle();
    
    if (gameState.currentLevelIndex >= LEVELS.length - 1) {
      setGameState(prev => ({ ...prev, screen: GameScreen.VICTORY }));
      saveScore();
    } else {
      setGameState(prev => ({ ...prev, screen: GameScreen.LEVEL_COMPLETE }));
    }
  };

  const nextLevel = () => {
    const nextIdx = gameState.currentLevelIndex + 1;
    const nextBoss = LEVELS[nextIdx];
    
    // Shuffle for new boss
    const allIds = nextBoss.questions.map(q => q.id);
    const shuffled = shuffleArray(allIds);

    setCurrentBoss(nextBoss);
    setGameState(prev => ({
      ...prev,
      currentLevelIndex: nextIdx,
      bossHp: nextBoss.maxHp,
      screen: GameScreen.PLAYING,
      playerHp: Math.min(prev.maxPlayerHp, prev.playerHp + 200), // Heal 200 HP
      remainingQuestions: shuffled
    }));
    
    pickNextQuestion(nextBoss, shuffled);
    audioManager.playClick();
  };

  const handleGameOver = () => {
    audioManager.stopMusic();
    setGameState(prev => ({ ...prev, screen: GameScreen.GAME_OVER }));
    saveScore();
  };

  const saveScore = () => {
    const name = prompt("Enter your name for the Hall of Fame:", "Student") || "Anonymous";
    const newEntry: HighScore = {
        name: name.substring(0, 12),
        score: Math.round(gameState.score),
        date: new Date().toISOString()
    };

    const existing = localStorage.getItem('chemBossLeaderboard');
    let scores: HighScore[] = existing ? JSON.parse(existing) : [];
    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep top 10
    
    localStorage.setItem('chemBossLeaderboard', JSON.stringify(scores));
  };

  // -- Timer Effect --
  useEffect(() => {
    if (gameState.screen === GameScreen.PLAYING && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (gameState.screen === GameScreen.PLAYING && timeLeft === 0) {
      // Time run out treat as wrong answer but no click event
      handleTimeRunOut();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState.screen]);

  const handleTimeRunOut = () => {
      audioManager.playError();
      setScreenShake(true);
      setPlayerDmgOverlay(true);
      setTimeout(() => {
          setScreenShake(false);
          setPlayerDmgOverlay(false);
      }, 500);

      const newPlayerHp = Math.max(0, gameState.playerHp - 150);
      setGameState(prev => ({ ...prev, playerHp: newPlayerHp, streak: 0 }));
      
      if (newPlayerHp <= 0) handleGameOver();
      else pickNextQuestion(currentBoss, gameState.remainingQuestions);
  };

  // -- Rendering --

  if (gameState.screen === GameScreen.MENU) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center relative bg-slate-900 overflow-hidden">
        <div className="scanlines"></div>
        <ParticleSystem trigger={1} type="spark" x={window.innerWidth/2} y={window.innerHeight/2} />
        
        <div className="z-10 text-center space-y-8 p-8 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-500">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 boss-font filter drop-shadow-lg tracking-tighter">
            CHEMISTRY<br/><span className="text-yellow-400">BOSS FIGHT</span>
          </h1>
          <p className="text-xl text-slate-300 tracking-widest">CLASS 12 EDITION</p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <button 
              onClick={startGame}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-bold text-xl hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="flex items-center justify-center gap-2"><Sword className="w-6 h-6" /> BATTLE START</span>
            </button>
            
            <button 
              onClick={() => setGameState(prev => ({...prev, screen: GameScreen.LEADERBOARD}))}
              className="px-8 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5 text-yellow-400" /> LEADERBOARD
            </button>
            
            <button 
              onClick={toggleSound}
              className="px-8 py-3 border border-slate-600 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-slate-400"
            >
              {gameState.isSoundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              {gameState.isSoundOn ? "SOUND ON" : "SOUND OFF"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.screen === GameScreen.LEADERBOARD) {
      return <Leaderboard onBack={() => setGameState(prev => ({...prev, screen: GameScreen.MENU}))} />;
  }

  if (gameState.screen === GameScreen.GAME_OVER || gameState.screen === GameScreen.VICTORY) {
    const isWin = gameState.screen === GameScreen.VICTORY;
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
        <div className="scanlines"></div>
        <div className={`z-10 text-center p-12 rounded-2xl border-4 ${isWin ? 'border-yellow-400 bg-yellow-900/30' : 'border-red-600 bg-red-900/30'} backdrop-blur-lg shadow-2xl animate-in zoom-in duration-300`}>
          {isWin ? <Trophy size={80} className="mx-auto text-yellow-400 mb-6 animate-bounce" /> : <Skull size={80} className="mx-auto text-red-500 mb-6 animate-pulse" />}
          
          <h2 className={`text-6xl font-black mb-4 boss-font ${isWin ? 'text-yellow-400' : 'text-red-500'}`}>
            {isWin ? 'VICTORY!' : 'GAME OVER'}
          </h2>
          
          <div className="text-2xl mb-8 font-mono">
            FINAL SCORE: <span className="text-white font-bold">{gameState.score}</span>
          </div>

          <button 
            onClick={() => setGameState(prev => ({ ...prev, screen: GameScreen.MENU }))}
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw size={24} /> PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (gameState.screen === GameScreen.LEVEL_COMPLETE) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 relative">
        <div className="scanlines"></div>
        <div className="z-10 text-center p-10 bg-slate-800/80 rounded-2xl border-2 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
          <Award size={64} className="mx-auto text-green-400 mb-4" />
          <h2 className="text-4xl font-bold text-white mb-2 boss-font">LEVEL CLEARED!</h2>
          <p className="text-slate-300 mb-8">Boss Defeated: {currentBoss.name}</p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
                <div className="text-sm text-slate-400">HP BONUS</div>
                <div className="text-2xl font-mono text-green-400">+200</div>
            </div>
            <div className="text-center">
                <div className="text-sm text-slate-400">SCORE</div>
                <div className="text-2xl font-mono text-yellow-400">{gameState.score}</div>
            </div>
          </div>

          <button 
            onClick={nextLevel}
            className="px-8 py-4 bg-green-500 text-slate-900 font-bold rounded-lg hover:bg-green-400 transition-all flex items-center justify-center gap-2 mx-auto animate-pulse"
          >
            NEXT LEVEL <ChevronRight />
          </button>
        </div>
      </div>
    );
  }

  // -- PLAYING SCREEN --
  return (
    <div className={`h-screen w-full bg-slate-900 flex flex-col overflow-hidden relative ${screenShake ? 'shake-anim' : ''}`}>
      <div className="scanlines"></div>
      {playerDmgOverlay && <div className="absolute inset-0 pointer-events-none z-50 screen-dmg-overlay bg-red-500/20"></div>}
      
      <ParticleSystem trigger={particleTrigger} type={particleType} x={clickCoords.x} y={clickCoords.y} />

      {/* Top Bar - Fixed Height */}
      <div className="h-14 bg-slate-900/80 px-4 flex justify-between items-center border-b border-slate-700 z-20 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-yellow-400 font-mono text-lg md:text-xl">
            <Trophy size={18} /> {gameState.score}
          </div>
          <div className="flex items-center gap-2 text-orange-400 font-mono text-lg md:text-xl ml-2 md:ml-4">
            <Flame size={18} /> x{gameState.streak}
          </div>
        </div>
        <div className="font-mono text-slate-400 text-sm">
          LVL {gameState.currentLevelIndex + 1}/{LEVELS.length}
        </div>
      </div>

      {/* Battle Area - Flex Container */}
      <div className="flex-1 relative flex flex-col p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
        
        {/* Health Bars - Fixed Height */}
        <div className="w-full max-w-4xl mx-auto flex justify-between gap-4 z-20 shrink-0">
          <HealthBar current={gameState.playerHp} max={gameState.maxPlayerHp} label="YOU" color="text-cyan-400" />
          <HealthBar current={gameState.bossHp} max={currentBoss.maxHp} label={currentBoss.name} color={currentBoss.color} isRightAligned />
        </div>

        {/* Visual Scene - Flexible Height */}
        <div className="flex-1 min-h-0 flex items-center justify-center w-full z-10">
             <BattleScene 
                boss={currentBoss} 
                isHit={bossIsHit} 
                isAttacking={bossIsAttacking}
                isPlayerHit={playerDmgOverlay}
            />
        </div>

        {/* Timer Bar - Fixed Height */}
        <div className="w-full max-w-2xl mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden z-20 shrink-0">
            <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-yellow-400'}`}
                style={{ width: `${(timeLeft / currentBoss.timeLimit) * 100}%` }}
            />
        </div>

        {/* Question Area - Flexible Height */}
        <div className="w-full max-w-3xl mx-auto z-20 shrink-0 mb-2">
           {currentQuestion && (
             <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col h-full justify-end">
               <div className="bg-slate-800/90 p-3 md:p-5 rounded-t-xl border-2 border-slate-600 text-center shadow-lg relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-600 px-3 py-0.5 rounded-full text-slate-300 flex items-center gap-1 text-xs md:text-sm">
                    <Timer size={12} /> {timeLeft}s
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-white leading-tight">
                    {currentQuestion.text}
                  </h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-900/50 p-2 md:p-3 rounded-b-xl border-x-2 border-b-2 border-slate-600 backdrop-blur-sm">
                 {currentQuestion.options.map((opt, idx) => (
                   <button
                     key={idx}
                     onClick={(e) => handleAnswer(idx, e)}
                     className="p-3 text-sm md:text-lg font-semibold text-left bg-slate-700/50 hover:bg-cyan-600/80 border border-slate-600 hover:border-cyan-400 rounded transition-all active:scale-95 flex items-center gap-2 group"
                   >
                     <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full text-slate-400 group-hover:text-white group-hover:bg-cyan-500 transition-colors text-xs shrink-0">
                       {String.fromCharCode(65 + idx)}
                     </span>
                     <span className="truncate">{opt}</span>
                   </button>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;