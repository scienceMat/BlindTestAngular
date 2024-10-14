import {Injectable} from '@angular/core';
import SpotifyWebApi from 'spotify-web-api-js';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {TrackDTO} from '../models/trackDTO';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  private player: any;
  private playerStateSubject = new BehaviorSubject<SpotifyApi.CurrentPlaybackResponse | null>(null);

  public playerState$ = this.playerStateSubject.asObservable();

  constructor(private authService: AuthService) {
    this.spotifyApi = new SpotifyWebApi();
  }

  public setAccessToken(token: string) {
    if(!!token){
      this.spotifyApi.setAccessToken(token);
      localStorage.setItem('spotify_token', token);
    }

  }

  public getUserPlaylists(): Observable<any> {
    return from(this.spotifyApi.getUserPlaylists());
  }

  public searchTracks(query: string): Observable<any> {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      this.setAccessToken(token);
      return from(this.spotifyApi.searchTracks(query));
    } else {
      return from(Promise.reject('No token provided'));
    }
  }

  public initializePlayer(token: string) {
    const currentUser = this.authService.currentUserValue;

    if (this.player) {
      console.log('Spotify Player already initialized');
      return; // Prevent re-initialization
    }

    if (!currentUser || !currentUser.isAdmin) {
      console.log('User is not an admin, Spotify Player initialization skipped.');
      return;
    }

    this.setAccessToken(token);
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
      this.player.addListener('player_state_changed', (state: SpotifyApi.CurrentPlaybackResponse) => {
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

    // Load the Spotify Player script dynamically
    if (!document.getElementById('spotify-player')) {
      const script = document.createElement('script');
      script.id = 'spotify-player';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }
  }

  public play(options: SpotifyApi.PlayParameterObject): Observable<any> {
    const deviceId = localStorage.getItem('device_id');
    const token = localStorage.getItem('spotify_token');
    if (deviceId && token) {
      this.setAccessToken(token);
      return from(fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(options),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }));
    } else {
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  public pause(): Observable<any> {
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

  public resume(): Observable<any> {
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

  public getCurrentTrack(): Observable<TrackDTO> {
    return from(
      this.spotifyApi.getMyCurrentPlayingTrack().then((response) => {
        const track = response.item as SpotifyApi.TrackObjectFull;
        return this.mapSpotifyTrackToDTO(track);
      })
    );
  }

   private mapSpotifyTrackToDTO(track: SpotifyApi.TrackObjectFull): TrackDTO {
    return {
      title: track.name,
      image: track.album.images[0]?.url || '',  // Use an empty string as a fallback
      artist: track.artists[0]?.name || '',     // Use an empty string as a fallback
      filePath: track.uri,
      duration_ms: track.duration_ms
    };
  }

  public nextTrack(): Observable<any> {
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

  public previousTrack(): Observable<any> {
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
      const errorMsg = 'Device ID or token not found';
      console.error(errorMsg);
      return from(Promise.reject(errorMsg));
    }
  }

  public getCurrentPlaybackState(): Observable<SpotifyApi.CurrentPlaybackResponse> {
    const token = localStorage.getItem('spotify_token');
    if (token) {
      this.setAccessToken(token);
      return from(this.spotifyApi.getMyCurrentPlaybackState());
    } else {
      return from(Promise.reject('No token provided'));
    }
  }
}
