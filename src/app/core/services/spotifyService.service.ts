import { Injectable } from '@angular/core';
import SpotifyWebApi from 'spotify-web-api-js';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { SpotifyPlaybackState } from '../models/SpotifyPlayBackState.model'; // Importez l'interface

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  private player: any;
  private playerStateSubject = new BehaviorSubject<SpotifyPlaybackState | null>(null);

  playerState$ = this.playerStateSubject.asObservable();

  constructor() {
    this.spotifyApi = new SpotifyWebApi();
  }

  setAccessToken(token: string) {
    this.spotifyApi.setAccessToken(token);
    localStorage.setItem('spotify_token', token); // Enregistrez le token dans localStorage
  }

  getUserPlaylists(): Observable<any> {
    return from(this.spotifyApi.getUserPlaylists());
  }

  searchTracks(query: string): Observable<any> {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      this.setAccessToken(token);
      return from(this.spotifyApi.searchTracks(query));
    } else {
      return from(Promise.reject('No token provided'));
    }
  }

  initializePlayer(token: string) {
    this.setAccessToken(token); // Enregistrez le token en utilisant setAccessToken
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      this.player = new (window as any).Spotify.Player({
        name: 'Angular Spotify Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(token); }
      });

      // Error handling
      this.player.addListener('initialization_error', (error: { message: string }) => { console.error(error.message); });
      this.player.addListener('authentication_error', (error: { message: string }) => { console.error(error.message); });
      this.player.addListener('account_error', (error: { message: string }) => { console.error(error.message); });
      this.player.addListener('playback_error', (error: { message: string }) => { console.error(error.message); });

      // Playback status updates
      this.player.addListener('player_state_changed', (state: SpotifyPlaybackState) => {
        console.log(state);
        this.playerStateSubject.next(state);
      });

      // Ready
      this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        localStorage.setItem('device_id', device_id);
      });

      // Not Ready
      this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player!
      this.player.connect().then((success: any) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        } else {
          console.error('The Web Playback SDK could not connect to Spotify.');
        }
      });
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);
  }

  play(options: SpotifyApi.PlayParameterObject): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      this.setAccessToken(token); // Assurez-vous que le token est défini
      return from(fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(options),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Ajoutez le token dans les en-têtes
        },
      }));
    } else {
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  pause(): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      return from(fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }));
    } else {
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  resume(): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      this.setAccessToken(token);
      return from(fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }));
    } else {
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  getCurrentTrack(): Observable<SpotifyApi.TrackObjectFull> {
    return from(this.spotifyApi.getMyCurrentPlayingTrack().then(response => response.item as SpotifyApi.TrackObjectFull));
  }
  

  nextTrack(): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      return from(fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }));
    } else {
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  previousTrack(): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      return from(fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }));
    } else {
      const errorMsg = 'Device ID ou token non trouvé';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  getCurrentPlaybackState(): Observable<SpotifyApi.CurrentPlaybackResponse> {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      this.setAccessToken(token); // Assurez-vous que le token est défini
      return from(this.spotifyApi.getMyCurrentPlaybackState());
    } else {
      return from(Promise.reject('No token provided'));
    }
  }
}
