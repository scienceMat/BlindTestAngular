import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Session } from '../models/session.model';
import { SpotifyService } from './spotifyService.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:8080/sessions';
  private sessionId: number | null = null;

  // Gestion de l'état de la session
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  session$ = this.sessionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private spotifyService: SpotifyService,
    private router: Router
  ) {}

  getAllSessions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  createSession(session: { name: string, adminId: number }): Observable<any> {
    return this.http.post(this.apiUrl, session);
  }

  joinSession(sessionId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/join`, { id: userId });
  }

  leaveSession(sessionId: number, userId: number): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}/${sessionId}/leave`, { userId });
}

  startSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/start`, {});
  }

  
  getSessionByUser(userId: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/user/${userId}`);
  }

  nextQuestion(sessionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/next`, {});
  }

  updateCurrentMusicIndex(sessionId: number, index: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/current-music`, { index });
  }

  getPlaylist(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}/playlist`);
  }

  addMusicToSession(sessionId: number, music: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/playlist`, music);
  }

  submitAnswer(sessionId: number, answer: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/answer`, answer);
  }

  indicateReady(sessionId: number, userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sessionId}/ready`, { userId });
  }

  checkAllReady(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}/checkAllReady`);
  }

  setSessionId(id: number | null) {
    this.sessionId = id;
    if (id !== null) {
      localStorage.setItem('sessionId', id.toString());
    } else {
      localStorage.removeItem('sessionId');
    }
  }

  getSession(sessionId: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${sessionId}`);
  }

  getSessionId(): number | null {
    if (!this.sessionId) {
      const storedId = localStorage.getItem('sessionId');
      this.sessionId = storedId ? parseInt(storedId, 10) : null;
    }
    return this.sessionId;
  }

  // Gestion de l'état de la session
  setSession(session: Session) {
    this.sessionSubject.next(session);
  }

  clearSession() {
    this.sessionSubject.next(null);
  }

  
}
