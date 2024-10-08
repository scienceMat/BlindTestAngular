import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserResponse } from '../models/user.model';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/users';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  public readonly USER_KEY = 'auth-user';
  public readonly TOKEN_KEY = 'auth-token';
  public readonly SPOTIFY_TOKEN_KEY = 'spotify_token';
  private readonly EXPIRY_KEY = 'auth-expiry';
  private readonly EXPIRY_DURATION = 3600000; // 1 hour in milliseconds
  private readonly clientId = '909dc01e3aee4ec4b72b8738a1ea7f1d'; // Spotify Client ID
  private readonly redirectUri = 'http://localhost:4200/callback'; // Redirect URI after Spotify login

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.checkSessionExpiry();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create`, user);
  }

  login(userName: string, password: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, { userName, password })
      .pipe(
        map(response => {
          const user: User = {
            id: response.id,
            userName: response.username,
            password: '', // Ne pas stocker le mot de passe
            isAdmin: response.admin
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.setSessionExpiry();
          this.currentUserSubject.next(user);
          return response;
        })
      );
  }

  setUserInLocalStorage(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  setTokenInLocalStorage(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    localStorage.removeItem(this.SPOTIFY_TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private setSessionExpiry() {
    const expiryTime = Date.now() + this.EXPIRY_DURATION;
    localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());
  }

  private checkSessionExpiry() {
    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    if (expiryTime && Date.now() > +expiryTime) {
      this.logout();
    }
  }

  // Méthode pour rediriger vers Spotify pour l'autorisation
  redirectToSpotifyLogin() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
      'streaming'
    ];

    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    window.location.href = authUrl; // Redirection vers la page d'authentification Spotify
  }

  // Récupérer le token Spotify depuis l'URL après la redirection
  getSpotifyAccessTokenFromUrl(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
  }

  // Sauvegarder le token Spotify dans localStorage
  saveSpotifyAccessToken(token: string) {
    localStorage.setItem(this.SPOTIFY_TOKEN_KEY, token);
  }

  // Valider le token Spotify
  validateSpotifyToken(): Observable<boolean> {
    const token = localStorage.getItem(this.SPOTIFY_TOKEN_KEY);
    if (!token) {
      return of(false);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get('https://api.spotify.com/v1/me', { headers }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  isSpotifyTokenValid(): boolean {
    const token = localStorage.getItem(this.SPOTIFY_TOKEN_KEY);
    return !!token;
  }



  isAuthenticated(): boolean {
    return this.currentUserValue !== null && this.isSpotifyTokenValid();
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getSpotifyAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('spotify_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}
