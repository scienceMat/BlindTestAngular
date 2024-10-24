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
  public currentUserGuestSubject: BehaviorSubject<{ username: string; sessionToken: string } | null>;


  public currentUser: Observable<User | null>;
  public readonly USER_KEY = 'auth-user';
  public readonly TOKEN_KEY = 'auth-token';
  public readonly SPOTIFY_TOKEN_KEY = 'spotify_token';
  private readonly EXPIRY_KEY = 'auth-expiry';
  private readonly EXPIRY_DURATION = 3600000; // 1 hour in milliseconds

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const storedGuestUser = sessionStorage.getItem('guest-user');
    let parsedGuestUser = null;

    if (storedGuestUser) {
      try {
        parsedGuestUser = JSON.parse(storedGuestUser);
      } catch (e) {
        console.error('Invalid guest user data in sessionStorage', e);
      }
    }
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUserGuestSubject = new BehaviorSubject<{ username: string, sessionToken: string } | null>(parsedGuestUser ? parsedGuestUser : null);

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

  public setUserInSessionStorage(user: User) {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public setTokenInSessionStorage(token: string) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  public setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  public setCurrentUserGuest(username: string, sessionToken: string): void {
    const guestUser = { username, sessionToken };
    sessionStorage.setItem('guest-user', JSON.stringify(guestUser));
    this.currentUserGuestSubject.next(guestUser);  // Mettre à jour le BehaviorSubject
  }

  public getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }


  public getCurrentUserGuest(): { username: string, sessionToken: string } | null {
    const storedGuest = sessionStorage.getItem('guest-user');
    return storedGuest ? JSON.parse(storedGuest) : null;
  }

  public logout() {
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRY_KEY);
    sessionStorage.removeItem(this.SPOTIFY_TOKEN_KEY);
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
