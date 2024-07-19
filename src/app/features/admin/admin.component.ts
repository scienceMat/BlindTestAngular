import { Component, OnInit, ChangeDetectorRef, TrackByFunction } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SpotifyService } from '../../core/services/spotifyService.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { Session } from '../../core/models/session.model';
import { Music } from '../../core/models/music.model';
import { switchMap } from 'rxjs/operators';
import { DisplayPlaylistComponent } from './components/display-playlist/display-playlist.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginButton } from '../../shared/components/LoginButton/login-button.component';
import { LecteurComponent } from '../lecteur/lecteur.component';
import { TrackDTO } from '../../core/models/trackDTO';
import { SelectSession } from '../../shared/components/SelectSession/select-session.component';
import { InputTextComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule,
     FormsModule,
      RouterModule,
       DisplayPlaylistComponent,
       LoginButton, SelectSession,
      LecteurComponent,
      InputTextComponent],
  providers: [UserService, SessionService, SpotifyService,InputTextComponent],
})
export class AdminComponent implements OnInit {
  sessionName: string = '';
  sessions: any[] = [];
  session: Session | null = null;
  selectedSessionId: number | null = null;
  playlist: TrackDTO[] = [];
  connected: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.isAdmin) {
      const token = localStorage.getItem('spotify_token');
      if (token) {
        this.connected = true;
        this.spotifyService.setAccessToken(token);
        this.loadSessions();
      } else {
        this.redirectToSpotifyLogin();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  redirectToSpotifyLogin() {
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

  loadSessions() {
    this.sessionService.getAllSessions().subscribe((response) => {
      this.sessions = response;
    });
  }

  createSession() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      const adminId = currentUser.id;
      this.sessionService.createSession({ name: this.sessionName, adminId: adminId })
        .pipe(
          switchMap((createdSession) => {
            console.log('Session created:', createdSession);
            return this.sessionService.getAllSessions();
          })
        )
        .subscribe(
          (sessions) => {
            this.sessions = sessions;
            console.log('Sessions updated:', sessions);
          },
          (error) => {
            console.error('Error:', error);
          }
        );
    } else {
      console.error('User not found. Please log in first.');
    }
  }

  joinSession() {
    const userId = this.authService.currentUserValue?.id;
    const sessionId = this.selectedSessionId;
    if (userId !== undefined && sessionId !== null) {
      this.sessionService.joinSession(sessionId, userId).subscribe((response) => {
        this.sessionService.setSessionId(response.id);
        this.session = response;
        this.loadPlaylist(sessionId);
        console.log('Joined session:', response);
      });
    } else {
      console.error('User ID or Session ID is null');
    }
  }

  loadPlaylist(sessionId: number) {
    this.sessionService.getPlaylist(sessionId).subscribe((playlist) => {
      this.playlist = playlist;
      this.cdr.detectChanges();
    });
  }

  startSession() {
    if (this.session) {
      this.sessionService.startSession(this.session.id).subscribe((response) => {
        this.session = response;
        console.log('Session started:', response);
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
