import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule for standalone component
import { SpotifyService } from '../../core/services/spotifyService.service'; // Import your Spotify service

@Component({
  selector: 'app-callback',
  standalone: true, // Mark the component as standalone
  template: '<p>Loading...</p>',
  imports: [CommonModule], // Add CommonModule to imports for standalone
})
export class CallbackComponent implements OnInit {
  constructor(private router: Router, private spotifyService: SpotifyService) {}

  ngOnInit() {
    const token = localStorage.getItem('spotify_token');
    const tokenExpiration = localStorage.getItem('spotify_token_expiration');
    const now = new Date().getTime();
  
    if ((token && token !== 'undefined') && tokenExpiration && now < parseInt(tokenExpiration)) {
      // Token is valid
      this.spotifyService.setAccessToken(token);
      this.router.navigate(['/admin']);
    } else {
      // Token is expired or missing, proceed with authentication
      const params = this.getHashParams();
      const newToken = params['access_token'];
      if (newToken) {
        const expiresIn = parseInt(params['expires_in']); // Spotify returns the expiration time
        const expirationTime = now + expiresIn * 1000; // Calculate expiration time in milliseconds
        localStorage.setItem('spotify_token', newToken);
        localStorage.setItem('spotify_token_expiration', expirationTime.toString());
        this.spotifyService.setAccessToken(newToken);
        console.log('Spotify access token stored:', newToken);
        this.router.navigate(['/admin']);
      } else {
        console.error('Spotify access token not found');
        this.redirectToSpotifyLogin();
      }
    }
  }

  private getHashParams(): { [key: string]: string } {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {} as { [key: string]: string });
  }

  private redirectToSpotifyLogin() {
    const clientId = '909dc01e3aee4ec4b72b8738a1ea7f1d';
    const redirectUri = 'http://localhost:4200/callback';
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-modify-playback-state',
      'user-read-playback-state',
      'user-read-currently-playing',
      'streaming'
    ];
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }
}
