export enum GameScreen {
    MENU = 'MENU',
    TUTORIAL = 'TUTORIAL',
    PLAYING = 'PLAYING',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY',
    LEADERBOARD = 'LEADERBOARD'
  }
  
  export enum BossType {
    BASIC = 'Reaction Wizard',
    ELECTRO = 'Electro Emperor',
    ORGANIC = 'Organic Demon',
    KINETICS = 'Kinetics Overlord',
    FINAL = 'Periodic Titan'
  }
  
  export interface Question {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
    damage: number;
  }
  
  export interface Boss {
    id: number;
    name: string;
    type: BossType;
    maxHp: number;
    icon: string; // Replacing imageSeed with icon identifier
    color: string;
    questions: Question[];
    timeLimit: number;
  }
  
  export interface GameState {
    screen: GameScreen;
    currentLevelIndex: number;
    playerHp: number;
    maxPlayerHp: number;
    bossHp: number;
    score: number;
    streak: number;
    isSoundOn: boolean;
    remainingQuestions: number[]; // IDs of questions left in the deck
  }

  export interface HighScore {
    name: string;
    score: number;
    date: string;
  }