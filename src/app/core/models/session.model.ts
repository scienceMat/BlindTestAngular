export interface Session {
    id: number;
  name: string;
  users: User[];
  scores: { [userId: number]: number };
  currentMusicIndex: number;
  status: string; // "waiting", "in-progress", "finished"
  startTime: string;
  endTime: string;
  questionStartTime: string;
  currentMusic: Music;
  musics: Music[];
  }
  
  export interface User {
    id: number;
    name: string;
    score: number;
  }
  
  export interface Music {
    id: number;
    title: string;
    artist: string;
    url: string;
  }
