import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'http://localhost:8080/game';

  constructor(private http: HttpClient) { }

  getQuestion(theme: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/questions?theme=${theme}`);
  }

  submitAnswer(userId: number, questionId: number, title: string, artist: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/answers`, { userId, questionId, title, artist });
  }
}
