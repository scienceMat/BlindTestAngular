import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Session} from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:8080/sessions';
  private sessionId: number | null = null;

  // Gestion de l'état de la session
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  public getAllSessions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  public createSession(session: { name: string, adminId: number }): Observable<any> {
    return this.http.post(this.apiUrl, session);
  }

  public joinSession(sessionId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/join`, { id: userId });
  }

  public leaveSession(sessionId: number, userId: number): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/${sessionId}/leave`, { id: userId });
}

  public startSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/start`, {});
  }

  public stopSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/stop`, {});
  }
  public getSessionByUser(userId: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/user/${userId}`);
  }

  public nextQuestion(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/next`, {});
  }

  public updateCurrentMusicIndex(sessionId: number, index: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/current-music`, { index });
  }

  public getPlaylist(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}/playlist`);
  }

  public addMusicToSession(sessionId: number, music: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/playlist`, music);
  }

  public submitAnswer(sessionId: number, answer: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/answer`, answer);
  }


  public setSessionId(id: number | null) {
    this.sessionId = id;
    if (id !== null) {
      localStorage.setItem('sessionId', id.toString());
    } else {
      localStorage.removeItem('sessionId');
    }
  }

  public getSession(sessionId: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${sessionId}`);
  }

  public nextTrack(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/nextTrack`, {});
  }

  // Add this method to go to the previous track
  public previousTrack(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/previousTrack`, {});
  }

  public getSessionId(): number | null {
    if (!this.sessionId) {
      const storedId = localStorage.getItem('sessionId');
      this.sessionId = storedId ? parseInt(storedId, 10) : null;
    }
    return this.sessionId;
  }

  // Gestion de l'état de la session
  public setSession(session: Session) {
    this.sessionSubject.next(session);
  }



}
