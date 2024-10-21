import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {User, UserResponse} from '../models/user.model';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/users';
  public currentUserSubject: BehaviorSubject<User | null>;
  public currentUserGuestSubject: BehaviorSubject<string | null>;

  
  public currentUser: Observable<User | null>;
  public readonly USER_KEY = 'auth-user';
  public readonly TOKEN_KEY = 'auth-token';
  public readonly SPOTIFY_TOKEN_KEY = 'spotify_token';
  private readonly EXPIRY_KEY = 'auth-expiry';
  private readonly EXPIRY_DURATION = 3600000; // 1 hour in milliseconds

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const storedGuestUser = sessionStorage.getItem('guest-user'); // Stockage pour l'utilisateur invité

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUserGuestSubject = new BehaviorSubject<string | null>(storedGuestUser ? storedGuestUser : null);

    this.currentUser = this.currentUserSubject.asObservable();
    this.checkSessionExpiry();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

 
  public createUser(user: { userName: string, password: string, isAdmin: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, user);
  }

  public login(userName: string, password: string): Observable<UserResponse> {
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

  public redirectToSpotifyLogin() {
    const clientId = '909dc01e3aee4ec4b72b8738a1ea7f1d';
    const redirectUri = 'http://localhost:4200/callback';
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
      'streaming'
    ];
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }

  public setUserInLocalStorage(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public setTokenInLocalStorage(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  public setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  public setCurrentUserGuest(username: string): void {
    sessionStorage.setItem('guest-user', username);
    this.currentUserGuestSubject.next(username);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getCurrentUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  public getCurrentUserGuest(): string | null {
    const username = sessionStorage.getItem('guest-user');
    return username;
  }

  public logout() {
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

  public isSpotifyTokenValid(): boolean {
    const token = localStorage.getItem(this.SPOTIFY_TOKEN_KEY);
    return !!token;
  }



  public isAuthenticated(): boolean {
    return this.currentUserValue !== null && this.isSpotifyTokenValid();
  }

  public getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

}
