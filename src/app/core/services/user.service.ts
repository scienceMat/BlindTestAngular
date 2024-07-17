import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/users';
  private userId: number | null = null;

  constructor(private http: HttpClient) { }

  createUser(user: { userName: string }): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  setUserId(id: number | null) {
    this.userId = id;
    if (id !== null) {
      localStorage.setItem('userId', id.toString());
    } else {
      localStorage.removeItem('userId');
    }
  }

  getUserId(): number | null {
    if (this.userId === null) {
      const storedId = localStorage.getItem('userId');
      this.userId = storedId ? parseInt(storedId, 10) : null;
    }
    return this.userId;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorageTest__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}
