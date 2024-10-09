import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:8080/users';
  private userId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  public createUser(user: { userName: string }): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  public setUserId(id: number | null) {
    this.userId = id;
    if (id !== null) {
      localStorage.setItem('userId', id.toString());
    } else {
      localStorage.removeItem('userId');
    }
  }

  public getUserId(): number | null {
    if (this.userId === null) {
      const storedId = localStorage.getItem('userId');
      this.userId = storedId ? parseInt(storedId, 10) : null;
    }
    return this.userId;
  }


  public getUserById(id: number) {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/${id}`, {headers});
  }

  public getAllUsers() {
    const headers = this.authService.getAuthHeaders();
    return this.http.get(this.apiUrl, {headers});
  }
}
