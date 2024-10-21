import { TrackDTO } from "./trackDTO";
import { User } from "./user.model";
export interface Session {
  id: string;
  name: string;
  adminId: number;
  users: User[]; // Ensure this is using the correct User type
  musicList: TrackDTO[];
  scores: { [key: number]: number };
  currentMusicIndex: number;
  status: string;
  startTime: Date;
  endTime: Date;
  questionStartTime: Date;
  currentMusic?: TrackDTO;
  sessionCode: string;
  round:number;
}
  
  
  export interface Music {
    id: number;
    title: string;
    artist: string;
    url: string;
  }
