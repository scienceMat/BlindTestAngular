import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Session} from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:8080/sessions';
  private sessionId: string | null = null;
  private sessionCode: string | null = null;

  // Gestion de l'état de la session
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  public getAllSessions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  
  public getSessionScores(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}/scores`);
  }

  public getSessionByCode(sessionCode: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/code/${sessionCode}`);
  }

  public createSession(session: { name: string, adminId: number }): Observable<any> {
    return this.http.post(this.apiUrl, session);
  }

  public joinSessionByCode(sessionCode: string, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionCode}/join`, { id: userId });
}

public joinSessionAsGuest(sessionCode: string, pseudo: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/${sessionCode}/join-as-guest`, pseudo);
}

public joinAsGuest(user: { userName: string, password:string, isAdmin: boolean }): Observable<any> {
  return this.http.post(`${this.apiUrl}/join-as-guest`, user);
}
 // Stocker le code de session dans localStorage
 public setSessionCode(code: string | null) {
  this.sessionCode = code;
  if (code !== null) {
    localStorage.setItem('sessionCode', code);
  } else {
    localStorage.removeItem('sessionCode');
  }
}

  public leaveSession(sessionId: string, userId: number): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/${sessionId}/leave`, { id: userId });
}

  public startSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/start`, {});
  }

  public stopSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/stop`, {});
  }
  public getSessionByUser(userId: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/user/${userId}`);
  }

  public nextQuestion(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/next`, {});
  }

  public updateCurrentMusicIndex(sessionId: string, index: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/current-music`, { index });
  }

  public getPlaylist(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}/playlist`);
  }

  public addMusicToSession(sessionId: string, music: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/playlist`, music);
  }

  submitAnswer(sessionId: string, answer: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/answer`, answer);
  }


  public setSessionId(id: string | null) {
    this.sessionId = id;
    if (id !== null) {
      localStorage.setItem('sessionId', id.toString());
    } else {
      localStorage.removeItem('sessionId');
    }
  }

  public getSession(sessionId: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${sessionId}`);
  }

  public nextTrack(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/nextTrack`, {});
  }

  // Add this method to go to the previous track
  public previousTrack(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/previousTrack`, {});
  }

  getCurrentMusicIndex(sessionId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${sessionId}/current-music-index`);
  }

  public getSessionId(): string | null {
    if (!this.sessionId) {
      const storedId = localStorage.getItem('sessionId');
      this.sessionId = storedId ? storedId : null;
    }
    return this.sessionId;
  }

  // Gestion de l'état de la session
  public setSession(session: Session) {
    this.sessionSubject.next(session);
  }

  public getSessionCode(): string | null {
    return localStorage.getItem('sessionCode');
  }
  


}
