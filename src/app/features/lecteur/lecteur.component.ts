import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpotifyService } from '@services/spotifyService.service';
import { Subscription } from 'rxjs';

import { Session } from '../../core/models/session.model';
import { TrackDTO } from '../../core/models/trackDTO';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { LoginButton } from '../../shared/components/LoginButton/login-button.component';
import { DisplayPlaylistComponent } from '../admin/components/display-playlist/display-playlist.component';
import { InputTextComponent } from '../../shared/components/input/input.component';
import { PlaylistService } from '../../core/services/utils/playlistService'; // Import the service

@Component({
  selector: 'app-lecteur',
  templateUrl: './lecteur.component.html',
  standalone: true,
  styleUrls: ['./lecteur.component.css'],
  imports: [CommonModule,
     FormsModule,
      RouterModule,
       LoginButton,
        DisplayPlaylistComponent,
         InputTextComponent],
})
export class LecteurComponent implements OnInit, OnDestroy {
  trackId = '3n3Ppam7vgaVa1iaRUc9Lp'; // Example track ID
  currentTrack: TrackDTO | null = null;
  @Input() session: Session | null = null; // Ajouter une propriété @Input() pour la session sélectionnée
  isPlaying: boolean = false;
  searchResults: any[] = [];
  searchTerm: string = '';
  playlist: TrackDTO[] = [];
  sessions: any[] = [];
  timeProgress: number = 0;
  trackDuration: number = 0; // Initialiser à 0 par défaut
  selectedSessionId: number | null = null;
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
  private lastUpdateTime: number = 0;
  private token: string = '' ;
  private connected : boolean = false;
  private subscription: Subscription = new Subscription();
  constructor(
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private authService: AuthService,
    public userService: UserService,
    private cdr: ChangeDetectorRef,
    private playlistService: PlaylistService
    // Ajoutez ChangeDetectorRef ici
  ) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('spotify_token') || '';

    // Extract and store the token from the URL hash if present
    this.extractTokenFromUrl();

    // Initialize the Spotify player with the token
    if (this.token) {
      this.spotifyService.initializePlayer(this.token);
      this.connected = true;

      // Subscribe to player state changes
      this.playerStateSubscription = this.spotifyService.playerState$.subscribe(state => {
        if (state) {
          this.updateTrackState(state);
        }
      });
      this.playlistService.playlist$.subscribe((playlist) => {
        this.playlist = playlist;
        console.log('Updated playlist:', playlist);
      });

      // Load all sessions
      this.loadSessions();
      this.subscription = this.sessionService.session$.subscribe(session => {
        this.session = session;
        if (session) {
          // Effectuer les opérations nécessaires lorsque la session change
          console.log('Session updated in LecteurComponent:', session);
        }
      });

      // Get initial player state
      this.spotifyService.getCurrentPlaybackState().subscribe(state => {
        if (state) {
          this.updateTrackState(state);
        }
      });
    } else {
      // Redirect to Spotify login if no token is found
      this.redirectToSpotifyLogin();
    }
  }

  private redirectToSpotifyLogin() {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(this.scopes.join(' '))}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    window.location.href = authUrl;
  }

  private extractTokenFromUrl(): void {
    const hashParams = this.getHashParams();
    const accessToken = hashParams['access_token'];
    
    if (accessToken) {
      // Store the token in localStorage
      localStorage.setItem('spotify_token', accessToken);
      this.token = accessToken;
      console.log('Spotify access token stored:', accessToken);

      // Optionally remove the hash from the URL for a cleaner look
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
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

  loadSessions() {
    this.sessionService.getAllSessions().subscribe(response => {
      this.sessions = response;
    });
  }



  search() {
    if (this.searchTerm) {
      this.spotifyService.searchTracks(this.searchTerm).subscribe(data => {
        this.searchResults = data.tracks.items;
      }, error => {
        console.error('Error searching tracks', error);
      });
    }
  }

  addTrackToPlaylist(track: any) {
    this.selectedSessionId = this.sessionService.getSessionId();
    if (this.selectedSessionId !== null) {
      const music = {
        title: track.name,
        image: track.album.images[0]?.url,
        artist: track.artists[0]?.name,
        filePath: track.uri,
        duration_ms: track.duration_ms
      };

      this.sessionService.addMusicToSession(this.selectedSessionId, music).subscribe((data: any) => {
        this.playlist = data.musics;

        // Add track to shared playlist
        const trackDTO: TrackDTO = {
          title: track.name,
          image: track.album.images[0]?.url,
          artist: track.artists[0]?.name,
          filePath: track.uri,
          duration_ms: track.duration_ms
        };
        this.playlistService.addTrack(trackDTO);

        if (this.playlist.length === 1) {
          this.playPlaylistTrack(this.playlist[0], 0); // Sélectionner la première piste ajoutée
        }
      });
    }
  }

  playTrack(uri: string, trackIndex: number) {
    const sessionId = this.session?.id;
    if (!sessionId) {
      console.error('Session ID is null');
      return;
    }

    this.spotifyService.play({ uris: [uri] }).subscribe(() => {
      this.isPlaying = true;

      // Récupérer l'état actuel du lecteur pour obtenir la durée de la piste
      this.spotifyService.getCurrentTrack().subscribe(track => {
        if (!track) {
          console.error('Track is null');
          return;
        }

        this.trackDuration = track.duration_ms || 0;
        this.startProgressBar(); // Démarrer la barre de progression dès que la piste commence à jouer

        // Mettre à jour l'index de la musique actuelle sur le back-end
        this.sessionService.updateCurrentMusicIndex(sessionId, trackIndex).subscribe(() => {
          console.log('Current music index updated');
        }, error => {
          console.error('Error updating current music index:', error);
        });
      }, error => {
        console.error('Error getting current track:', error);
      });
    }, error => {
      console.error('Error playing track:', error);
    });
  }


  playPlaylistTrack(track: TrackDTO, trackIndex: number) {
    if(!this.startSession){

      this.currentTrack = track;
      this.trackDuration = track.duration_ms || 0; // Mettre à jour la durée de la piste, 0 si non définie
      this.timeProgress = 0;
      this.playTrack(track.filePath, trackIndex); // Passez l'index de la piste ici
    }
  }

  pause() {
    this.spotifyService.pause().subscribe(() => {
      this.isPlaying = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }, error => {
      console.error('Error pausing track:', error);
    });
  }

  resume() {
    this.spotifyService.resume().subscribe(() => {
      this.isPlaying = true;
      this.startProgressBar();
    }, error => {
      console.error('Error resuming track:', error);
    });
  }

  nextTrack() {
    this.spotifyService.nextTrack().subscribe();
  }

  previousTrack() {
    this.spotifyService.previousTrack().subscribe();
  }

  startSession() {
    const sessionId = this.sessionService.getSessionId();
    if (sessionId) {
      this.sessionService.startSession(sessionId).subscribe((response) => {
        this.sessionService.setSession(response); // Mettre à jour la session dans le service
        console.log('Session started:', response);
      });
    }
  }

  nextQuestion() {
    if (this.session && this.session.id) {
      this.sessionService.nextQuestion(this.session.id).subscribe(response => {
        this.session = response;
        this.playNextTrack();
      });
    }
  }

  submitAnswer(title: string, artist: string) {
    if (this.session && this.session.id !== null) {
      const answer = {
        userId: this.userId,
        title: title,
        artist: artist
      };
      this.sessionService.submitAnswer(this.session.id, answer).subscribe(response => {
        console.log('Answer submitted', response);
      }, error => {
        console.error('Error submitting answer:', error);
      });
    }
  }



  private mapToTrackDTO(state: any): TrackDTO | null {
    if (state && state.track_window && state.track_window.current_track) {
      const track = state.track_window.current_track;
      return {
        title: track.name,
        image: track.album.images[0]?.url,
        artist: track.artists[0]?.name,
        filePath: track.uri,
        duration_ms: track.duration_ms
      };
    }
    return null;
  }

  private updateTrackState(state: any) {
    const trackDTO = this.mapToTrackDTO(state);
    if (trackDTO) {
      this.currentTrack = trackDTO;
      this.isPlaying = !state.paused;
      this.trackDuration = trackDTO.duration_ms || 0; // Mettre à jour la durée de la piste, 0 si non définie
      this.timeProgress = state.position || 0; // Mettre à jour la position de la piste, 0 si non définie
      this.lastUpdateTime = performance.now();
      if (this.isPlaying) {
        this.startProgressBar();
      } else {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
      }
    } else {
      console.error('Invalid state object', state);
      this.currentTrack = null;
      this.isPlaying = false;
      this.trackDuration = 0;
      this.timeProgress = 0;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  private startProgressBar() {
    const updateProgress = () => {
      if (!this.isPlaying) return;

      const now = performance.now();
      const elapsedTime = now - this.lastUpdateTime;
      this.lastUpdateTime = now;

      if (this.timeProgress + elapsedTime < this.trackDuration) {
        this.timeProgress += elapsedTime;
        this.animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        this.timeProgress = this.trackDuration;
        cancelAnimationFrame(this.animationFrameId);
      }

      this.cdr.detectChanges(); // Ajoutez ceci pour forcer la détection des changements
    };
    this.animationFrameId = requestAnimationFrame(updateProgress);
  }

  private getHashParams(): { [key: string]: string } {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {} as { [key: string]: string });
  }

  private playNextTrack() {
    if (this.playlist && this.playlist.length > 0) {
      const currentIndex = this.session?.currentMusicIndex || 0;
      const nextIndex = (currentIndex + 1) % this.playlist.length; // Boucle à travers la playlist
      const nextTrack = this.playlist[nextIndex];

      if (nextTrack && this.session) {
        this.playTrack(nextTrack.filePath, nextIndex);
        this.sessionService.updateCurrentMusicIndex(this.session.id, nextIndex).subscribe(); // Mise à jour de l'index sur le serveur
      }
    }
  }
}
