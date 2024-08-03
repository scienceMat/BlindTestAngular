// playlist.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TrackDTO } from '../../../core/models/trackDTO';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private playlistSubject: BehaviorSubject<TrackDTO[]> = new BehaviorSubject<TrackDTO[]>([]);
  public playlist$: Observable<TrackDTO[]> = this.playlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPlaylist(): TrackDTO[] {
    return this.playlistSubject.value;
  }

  setPlaylist(playlist: TrackDTO[]): void {
    this.playlistSubject.next(playlist);
  }

  addTrack(track: TrackDTO): void {
    const updatedPlaylist = [...this.playlistSubject.value, track];
    this.playlistSubject.next(updatedPlaylist);
  }

  // New method to load playlist from the backend
  loadPlaylistFromBackend(sessionId: number): Observable<TrackDTO[]> {
    return this.http.get<TrackDTO[]>(`/api/sessions/${sessionId}/playlist`);
  }
}
