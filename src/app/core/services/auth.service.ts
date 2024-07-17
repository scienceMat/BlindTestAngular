import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/users';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly USER_KEY = 'currentUser';
  private readonly EXPIRY_KEY = 'expiryTime';
  private readonly EXPIRY_DURATION = 3600000; // 1 hour in milliseconds

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.checkSessionExpiry();
    setInterval(() => this.checkSessionExpiry(), 60000); // Check every minute
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create`, user);
  }

  login(userName: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, { userName, password })
      .pipe(map(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.setSessionExpiry();
        this.currentUserSubject.next(user);
        return user;
      }));
  }

  logout() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    this.currentUserSubject.next(null);
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
}
