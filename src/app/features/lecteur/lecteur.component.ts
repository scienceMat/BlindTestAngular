import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpotifyService } from '@services/spotifyService.service';
import { Subscription,switchMap, catchError, of,timer  } from 'rxjs';

import { Session } from '../../core/models/session.model';
import { TrackDTO, SpotifyPlaybackState } from '../../core/models/trackDTO';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { LoginButton } from '../../shared/components/LoginButton/login-button.component';
import { DisplayPlaylistComponent } from '../admin/components/display-playlist/display-playlist.component';
import { InputTextComponent } from '../../shared/components/input/input.component';
import { PlaylistService } from '../../core/services/utils/playlistService';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons'; // Import de l'icône plus
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-lecteur',
  templateUrl: './lecteur.component.html',
  standalone: true,
  styleUrls: ['./lecteur.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoginButton,
    DisplayPlaylistComponent,
    InputTextComponent,
    FontAwesomeModule
  ],
})
export class LecteurComponent implements OnInit, OnDestroy {
  @Input() session: Session | null = null;
  @Input() currentTrack: TrackDTO | null = null; 

  @Output() trackPaused: EventEmitter<void> = new EventEmitter();
  @Output() trackResumed: EventEmitter<void> = new EventEmitter();
  @Output() nextTrackEvent: EventEmitter<void> = new EventEmitter();
  @Output() previousTrackEvent: EventEmitter<void> = new EventEmitter();

  trackId = '3n3Ppam7vgaVa1iaRUc9Lp'; // Example track ID
  isPlaying: boolean = false;
  searchResults: any[] = [];
  searchTerm: string = '';
  playlist: TrackDTO[] = [];
  sessions: any[] = [];
  timeProgress: number = 0;
  trackDuration: number = 0;
  selectedSessionId: number | null = null;
  userId: number = 1; // Example user ID
  faPlus = faPlus;

  private clientId = '909dc01e3aee4ec4b72b8738a1ea7f1d';
  private redirectUri = 'http://localhost:4200/callback';
  private scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
    'streaming',
  ];

  private subscriptions = new Subscription();
  private animationFrameId: any;
  private lastUpdateTime: number = 0;
  private token: string = '';
  private playerInitialized: boolean = false;

  constructor(
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private authService: AuthService,
    public userService: UserService,
    private cdr: ChangeDetectorRef,
    private playlistService: PlaylistService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('spotify_token') || '';
    const sessionId = this.route.snapshot.paramMap.get('id');

    console.log('Validating Spotify token:', this.token); // Log pour vérifier le token

    // Extract and store the token from the URL hash if present
    this.extractTokenFromUrl();
  
    // Initialize the Spotify player with the token if not already done
    if (this.token && !this.playerInitialized) {
      this.spotifyService.initializePlayer(this.token);
      this.playerInitialized = true;
  
      // Subscribe to player state changes
      this.subscriptions.add(
        this.spotifyService.playerState$.subscribe(state => {
          if (state) {
            this.updateTrackState(state);
          }
        })
      );
  
      // Subscribe to playlist changes
      this.subscriptions.add(
        this.playlistService.playlist$.subscribe(playlist => {
          this.playlist = playlist;
          console.log('Updated playlist:', playlist);
        })
      );
  
      // Load all sessions
      this.loadSessions();
  
      // Subscribe to session changes
      this.subscriptions.add(
        this.sessionService.session$.subscribe(session => {
          this.session = session;
          if (session) {
            console.log('Session updated in LecteurComponent:', session);
          }
        })
      );

      
  
      // Get initial player state
      this.spotifyService.getCurrentPlaybackState().subscribe(state => {
        if (state) {
          this.updateTrackState(state);
        }
      });
    } else if (!this.token) {
      // Redirect to Spotify login if no token is found
      this.redirectToSpotifyLogin();
    }

    this.nextTrackEvent.subscribe(() => {
      this.nextTrack(); 
    });

    this.previousTrackEvent.subscribe(() => {
      this.previousTrack(); 
    });

    this.trackPaused.subscribe(() => {
      this.pause(); 
    });

    this.trackResumed.subscribe(() => {
      this.resume(); 
    });

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Unsubscribe from all subscriptions
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
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

  private loadSessions() {
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
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId !== null) {
      const music = {
        title: track.name,
        image: track.album.images[0]?.url,
        artist: track.artists[0]?.name,
        filePath: track.uri,
        duration_ms: track.duration_ms
      };

      this.sessionService.addMusicToSession(sessionId, music).subscribe((data: any) => {
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
      });
    }
  }

  playTrack(uri: string) {
    if (!this.session?.id) {
      console.error('Session ID is null');
      return;
    }
  
    console.log('Playing track:', uri);
  
    this.spotifyService.play({ uris: [uri] })
      .pipe(
        // Attendre un court délai pour s'assurer que la musique commence
        switchMap(() => {
          this.isPlaying = true;
          return timer(500); // Attendre 500 millisecondes pour assurer le démarrage de la musique
        }),
        // Aucun besoin de récupérer la piste en cours depuis Spotify
        catchError(error => {
          console.error('Error playing track:', error);
          return of(null); // Retourner une observable nulle en cas d'erreur
        })
      )
      .subscribe(() => {
        // Vous avez déjà la piste dans `this.currentTrack`, donc vous pouvez l'utiliser directement
        if (!this.currentTrack) {
          console.error('Current track is null');
          return;
        }
  
        // Définir la durée de la piste à partir de `this.currentTrack`
        this.trackDuration = this.currentTrack.duration_ms || 0;
  
        // Démarrer la barre de progression
        this.startProgressBar();
      });
  }

  playPlaylistTrack(track: TrackDTO) {
    const sessionId = this.session?.id;
    if (this.session?.status === 'in-progress') {
      this.currentTrack = track;
      this.trackDuration = track.duration_ms || 0;
      this.timeProgress = 0;
      this.playTrack(track.filePath);
    }
  }

  pause() {
    this.spotifyService.pause().subscribe(() => {
      this.isPlaying = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }, (error) => {
      console.error('Error pausing track:', error);
    });
  }

  resume() {
    if (this.session) {
      this.sessionService.getCurrentMusicIndex(this.session.id).subscribe(currentMusicIndex => {
        if (currentMusicIndex < 0 || currentMusicIndex >= this.playlist.length) {
          console.error('Invalid music index from backend.');
          return;
        }
  
        const nextTrack = this.playlist[currentMusicIndex];
        if (nextTrack) {
          // Vérification si la musique actuelle est déjà la bonne
          this.spotifyService.getCurrentPlaybackState().subscribe(state => {
            if (state && state.item && state.item.uri === nextTrack.filePath) {
              // Si la musique actuelle est la bonne, on reprend
              this.spotifyService.resume().subscribe(() => {
                this.isPlaying = true;
                this.startProgressBar();
                console.log('Resumed playback of current track.');
              }, error => {
                console.error('Error resuming track:', error);
              });
            } else {
              // Si la musique actuelle n'est pas la bonne, on joue la bonne musique
              console.log('Playing correct track:', nextTrack.filePath);
              this.playTrack(nextTrack.filePath);
            }
          }, error => {
            console.error('Error fetching current playback state:', error);
          });
        }
      }, error => {
        console.error('Error retrieving current music index:', error);
      });
    }
  }

  nextTrack() {
    if (!this.playlist || this.playlist.length === 0) {
      console.error('Playlist is empty or not defined.');
      return;
    }

    // Récupérer l'index actuel de la musique depuis le backend
    if (this.session) {
      this.sessionService.getCurrentMusicIndex(this.session.id).subscribe(currentMusicIndex => {
        if (currentMusicIndex < 0 || currentMusicIndex >= this.playlist.length) {
          console.error('Invalid music index from backend.');
          return;
        }

        const nextTrack = this.playlist[currentMusicIndex];
        if (nextTrack) {
          this.playTrack(nextTrack.filePath);
        }
      }, error => {
        console.error('Error retrieving current music index:', error);
      });
    }
}

previousTrack() {
  if (!this.session || !this.session.id || !this.playlist || this.playlist.length === 0) {
    console.error('Session or playlist is not defined.');
    return;
  }

  if (this.session) {
    this.sessionService.getCurrentMusicIndex(this.session.id).subscribe(currentMusicIndex => {
      if (currentMusicIndex < 0 || currentMusicIndex >= this.playlist.length) {
        console.error('Invalid music index from backend.');
        return;
      }

      const previousTrack = this.playlist[currentMusicIndex];
      if (previousTrack) {
        this.playTrack(previousTrack.filePath);
      }
    }, error => {
      console.error('Error retrieving current music index:', error);
    });
  }
}
  startSession() {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.sessionService.startSession(sessionId).subscribe((response) => {
        this.sessionService.setSession(response);
        if(this.playlist.length >0){
          this.currentTrack = this.playlist[0]        }
        console.log('Session started:', response);
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

  private mapCurrentPlaybackResponseToPlaybackState(
    response: SpotifyApi.CurrentPlaybackResponse
  ): SpotifyPlaybackState {
    return {
      paused: !response.is_playing,
      position: response.progress_ms || 0,
      duration: response.item?.duration_ms || 0,
      track_window: {
        current_track: {
          name: response.item?.name || '',
          album: {
            images: response.item?.album.images || [],
            name: response.item?.album.name || '',
            // Populate other necessary album fields
          },
          artists: response.item?.artists.map((artist) => ({
            name: artist.name,
            // Populate other necessary artist fields
          })) || [],
          uri: response.item?.uri || '',
          duration_ms: response.item?.duration_ms || 0,
          // Populate other necessary track fields
        },
      },
    };
  }

  private updateTrackState(state: SpotifyApi.CurrentPlaybackResponse) {
    const playbackState = this.mapCurrentPlaybackResponseToPlaybackState(state);
  
    const trackDTO = this.mapToTrackDTO(playbackState.track_window.current_track);
  
    this.currentTrack = trackDTO;
    this.isPlaying = !playbackState.paused;
    this.trackDuration = trackDTO.duration_ms || 0;
    this.timeProgress = playbackState.position || 0;
    this.lastUpdateTime = performance.now();
  
    if (this.isPlaying) {
      this.startProgressBar();
    } else {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }

  mapToTrackDTO(currentTrack: any): TrackDTO {
    // Map only necessary fields
    return {
      title: currentTrack.name,
      image: currentTrack.album.images[0]?.url || '', // Provide default empty string if no images
      artist: currentTrack.artists.map((artist: any) => artist.name).join(', '), // Combine artist names
      filePath: currentTrack.uri,
      duration_ms: currentTrack.duration_ms || 0 // Default to 0 if undefined
    };
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

      this.cdr.detectChanges();
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

}
