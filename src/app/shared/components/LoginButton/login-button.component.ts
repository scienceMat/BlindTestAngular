import {Component, OnDestroy, OnInit} from '@angular/core';
import {SpotifyService} from '@services/spotifyService.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-login-button',
  standalone: true,
  templateUrl: './login-button.component.html',
  styleUrls: ['./login-button.component.css'],
})
export class LoginButton implements OnInit, OnDestroy {
  sessions: any[] = [];
  userId: number = 1; // Example user ID, you might want to get this dynamically
  private clientId = '909dc01e3aee4ec4b72b8738a1ea7f1d';
  private redirectUri = 'http://localhost:4200/callback';
  private scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
    'streaming'
  ];
  private playerStateSubscription: Subscription = new Subscription();
  private animationFrameId: any;
  private token: string = '';
  private connected: boolean = false;

  constructor(
    private spotifyService: SpotifyService,
  ) {
  }

  ngOnInit(): void {
    const params = this.getHashParams();
    this.token = params['access_token'];

    if (this.token) {
      localStorage.setItem('spotify_token', this.token);
      this.spotifyService.setAccessToken(this.token);
      this.spotifyService.initializePlayer(this.token);
      this.connected = true;
    }
  }

  ngOnDestroy(): void {
    if (this.playerStateSubscription) {
      this.playerStateSubscription.unsubscribe();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.connected = false;
  }

  login() {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(this.scopes.join(' '))}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    window.location.href = authUrl;
  }

  private getHashParams(): { [key: string]: string } {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {} as { [key: string]: string });
  }


}
