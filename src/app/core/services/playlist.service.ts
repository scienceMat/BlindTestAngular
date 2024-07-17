import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private apiUrl = 'http://localhost:3000/playlist'; // URL de votre API backend

  constructor(private http: HttpClient) {}

  getPlaylist(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  savePlaylist(playlist: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl, playlist);
  }
}
