import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { Session } from '../../core/models/session.model';
import { TrackDTO } from '../../core/models/trackDTO';
import { User } from '../../core/models/user.model';
import { LecteurComponent } from '../lecteur/lecteur.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../core/services/utils/playlistService';
import { Subscription } from 'rxjs';
import { WebSocketService } from '@services/web-socket.service';
import { UserService } from '@services/user.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-session-screen',
  standalone: true,
  templateUrl: './session-screen.component.html',
  styleUrls: ['./session-screen.component.css'],
  imports: [LecteurComponent, FormsModule, CommonModule]
})
export class SessionScreenComponent implements OnInit, OnDestroy {
  session: Session | null = null;
  playlist: TrackDTO[] = [];
  currentTrack: TrackDTO | null = null;
  scores: { user: User, score: number }[] = [];
  private playlistSubscription: Subscription = new Subscription();
  private sessionSubscription: Subscription = new Subscription();
  private userSubscription!: Subscription;  

  connected: boolean = false;
  sessionStarted: boolean = false;
  sessionPaused: boolean = false;
  showRanking: boolean = false;
  hasBuzzed: boolean = false;
  ranking: any[] = [];
  showSubmitButton: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private userService: UserService,
    private playlistService: PlaylistService,
    private router: Router,
    private webSocketService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const sessionId = this.route.snapshot.paramMap.get('id');
    const userId = this.authService.getCurrentUser()?.id;

    if (sessionId && userId) {
      this.loadSession(parseInt(sessionId));
      // this.checkSessionConnection(userId);
      this.initializeWebSocketConnection(parseInt(sessionId)); // Pass sessionId for specific subscription
    } else {
      console.log("redirect to  admin")
      this.router.navigate(['/admin']); // Navigate back if session or user ID is missing

    }

    // Subscribe to playlist changes
    this.playlistSubscription = this.playlistService.playlist$.subscribe((playlist) => {
      this.playlist = playlist;
      this.currentTrack = playlist[0]; // Example: set current track to the first one
      console.log('Updated playlist:', playlist);
    });

    // Subscribe to session changes
    this.sessionSubscription = this.sessionService.session$.subscribe((session) => {
      this.session = session;
      if (session?.currentMusic) {
        this.playlistService.setPlaylist(session.musicList);
        this.currentTrack = session.currentMusic;
        console.log('Updated session in SessionScreenComponent:', session);
      }
    });
  }

  initializeWebSocketConnection(sessionId: number) {
    this.webSocketService.connectSocket().subscribe(() => {
      this.webSocketService.subscribeToSession(sessionId).subscribe(
        (message) => {
          console.log('Received data: ', message);
          this.handleWebSocketMessage(message);
        },
        (error) => console.error('WebSocket error:', error),
        () => console.log('WebSocket connection closed')
      );
    });
  }

  handleWebSocketMessage(message: string): void {
    console.log('Received WebSocket message:', message);
    switch (message) {
      case 'START_SESSION':
        this.sessionStarted = true;
        this.sessionPaused = false;
        break;
      case 'END_OF_ROUND':
        this.sessionPaused = true;
        this.showRanking = true;
        setTimeout(() => {
          this.showRanking = false;
          this.sessionPaused = false;
          this.showSubmitButton = true;
        }, 5000);
        break;
      case 'NEXT_MUSIC':
        this.sessionStarted = true;
        this.sessionPaused = false;
        this.hasBuzzed = false;
        this.showSubmitButton = true;
        break;
      case 'SESSION_FINISHED':
        this.sessionStarted = false;
        this.sessionPaused = false;
        // Display the final score
        break;
      case 'STOP_SESSION':
        this.sessionStarted = false;
        this.sessionPaused = true;
        // pause
        break;
      case 'NEXT_TRACK':
      case 'PREVIOUS_TRACK':
        this.sessionService.getSession(this.session!.id).subscribe((updatedSession) => {
          this.session = updatedSession;
          this.updateDOMForTrackChange(message);
        });
        break;
      default:
        this.handleScoreUpdates(message);
    }
  }

  handleScoreUpdates(message: string): void {
    try {
      const scores = JSON.parse(message);
      if (Array.isArray(scores)) {
        this.ranking = scores;
        this.showRanking = true;
        setTimeout(() => {
          this.showRanking = false;
          this.sessionPaused = false;
        }, 5000);
      }
    } catch (e) {
      console.error('Failed to parse scores', e);
    }
  }

  updateDOMForTrackChange(direction: string): void {
    if (this.session) {
      const currentTrack = this.session.musicList[this.session.currentMusicIndex];
      this.displayTrackChangeNotification(currentTrack, direction);
    }
  }

  displayTrackChangeNotification(track: TrackDTO, direction: string): void {
    const message = direction === 'NEXT_TRACK' ? 'Next track playing' : 'Previous track playing';
    alert(`${message}: ${track.title} by ${track.artist}`);
  }

  ngOnDestroy() {
    this.playlistSubscription.unsubscribe();
    this.sessionSubscription.unsubscribe();
  }

  loadSession(sessionId: number) {
    this.sessionService.getSession(sessionId).subscribe((session) => {
      this.session = session;
      this.playlistService.setPlaylist(session.musicList); // Set initial playlist
      this.scores = this.mapScores(session.scores);
      console.log('Loaded session:', session);
    });
  }

  mapScores(scoreMap: { [key: number]: number }): { user: User, score: number }[] {
    return Object.entries(scoreMap).map(([userId, score]) => ({
      user: this.session?.users.find(u => u.id === +userId) as User,
      score: score
    }));
  }

  startSession() {
    const sessionId = this.sessionService.getSessionId();
    if (sessionId) {
      this.sessionService.startSession(sessionId).subscribe((response) => {
        this.sessionService.setSession(response);
        if (this.playlist.length > 0) {
          this.currentTrack = this.playlist[0];
        }
        console.log('Session started:', response);
      });
    }
  }

  stopSession() {
    const sessionId = this.session?.id;
    if (sessionId) {
      this.sessionService.stopSession(sessionId).subscribe((response) => {
        this.session = response;
        console.log('Session stopped:', response);
      });
    } else {
      console.error('Session ID is null');
    }
  }

  leaveSession() {
    const userId = this.userService.getUserId();
    const sessionId = this.session?.id;
    if (sessionId) {
      this.sessionService.leaveSession(sessionId, userId as number).subscribe(() => {
        console.log('Left session');
        this.router.navigate(['/']); // Redirect to home or sessions list
      });
    }
  }

  // private checkSessionConnection(userId: number): void {
  //   const sessionId = localStorage.getItem('connectedSessionId');

  //   if (!sessionId) {
  //     console.log('No connected session ID found, redirecting to admin.');
  //     // this.router.navigate(['/admin']); // Redirect if no session ID is found
  //     return;
  //   }

  //   this.sessionService.getSession(parseInt(sessionId)).subscribe(
  //     (session) => {
  //       if (session && session.users.some(participant => participant.id === userId)) {
  //         this.session = session;
  //         this.sessionService.setSession(session);
  //         this.connected = true;
  //         console.log('User is already connected to session:', session);
  //       } else {
  //         console.warn('User is not connected to this session or session does not exist. Clearing session data.');
  //         localStorage.removeItem('connectedSessionId');
  //         // this.router.navigate(['/admin']); // Redirect back to admin screen
  //       }
  //     },
  //     (error) => {
  //       console.error('Error checking session connection:', error);
  //       this.handleErrorDuringSessionCheck();
  //     }
  //   );
  // }

  private handleErrorDuringSessionCheck() {
    console.error('Encountered an error during session check. Please try again later.');
    // this.router.navigate(['/admin']);
  }
}
