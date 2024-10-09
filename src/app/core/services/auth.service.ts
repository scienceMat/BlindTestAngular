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
  private apiUrl = 'http://localhost:8080/users';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  public readonly USER_KEY = 'auth-user';
  public readonly TOKEN_KEY = 'auth-token';
  public readonly SPOTIFY_TOKEN_KEY = 'spotify_token';
  private readonly EXPIRY_KEY = 'auth-expiry';
  private readonly EXPIRY_DURATION = 3600000; // 1 hour in milliseconds

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

}
