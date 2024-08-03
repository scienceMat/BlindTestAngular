import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SpotifyService } from '../../core/services/spotifyService.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { Session } from '../../core/models/session.model';
import { TrackDTO } from '../../core/models/trackDTO';
import { DisplayPlaylistComponent } from './components/display-playlist/display-playlist.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginButton } from '../../shared/components/LoginButton/login-button.component';
import { LecteurComponent } from '../lecteur/lecteur.component';
import { SelectSessionComponent } from '../../shared/components/SelectSession/select-session.component';
import { InputTextComponent } from '../../shared/components/input/input.component';
import { PlaylistService } from '../../core/services/utils/playlistService';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    DisplayPlaylistComponent,
    LoginButton,
    LecteurComponent,
    InputTextComponent, SelectSessionComponent],
  providers: [UserService, SessionService, SpotifyService,InputTextComponent],
})
export class AdminComponent implements OnInit {
  sessionName: string = '';
  sessions: Session[] = [];
  session: Session | null = null;
  selectedSessionId: number | null = null;
  playlist: TrackDTO[] = [];
  connected: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef,
    private playlistService: PlaylistService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.isAdmin) {
      const token = localStorage.getItem('spotify_token');
      if (token) {
        this.connected = true;
        this.spotifyService.setAccessToken(token);
        this.loadSessions();

        // Check if the user is already connected to a session
        this.checkSessionConnection(currentUser.id);
      } else {
        this.redirectToSpotifyLogin();
      }
    } else {
      this.router.navigate(['/login']);
    }

    this.playlistService.playlist$.subscribe((playlist) => {
      this.playlist = playlist;
      console.log('Received playlist update in AdminComponent:', playlist);
    });
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
        this.sessionService.setSession(response); // Update session in the service
        this.loadPlaylist(sessionId);
        this.saveSessionConnection(sessionId); // Save session connection to local storage
        this.cdr.detectChanges();
        console.log('Joined session:', response);
      });
    } else {
      console.error('User ID or Session ID is null');
    }
  }

  private saveSessionConnection(sessionId: number) {
    localStorage.setItem('connectedSessionId', sessionId.toString());
  }

  loadPlaylist(sessionId: number) {
    this.sessionService.getPlaylist(sessionId).subscribe((playlist) => {
      this.playlist = playlist.musics;
      this.cdr.detectChanges();
    });
  }

  startSession() {
    const sessionId = this.sessionService.getSessionId();
    if (sessionId) {
      this.sessionService.startSession(sessionId).subscribe((response) => {
        this.sessionService.setSession(response); // Mettre à jour la session dans le service
        console.log('Session started:', response);
        this.router.navigate(['/session-screen', sessionId]); // Navigate to the session screen

      });
    }
  }

  onSessionSelected(session: Session) {
    this.selectedSessionId = session.id;
    this.sessionService.setSession(session); // Mettre à jour la session dans le service
    this.loadPlaylist(session.id); // Load the playlist for the selected session
    this.saveSessionConnection(session.id); // Save the connection to local storage
    console.log('Selected session:', session);
  }

  onSessionJoined(session: Session) {
    this.selectedSessionId = session.id;
    this.session = session;
    this.saveSessionConnection(session.id);
    console.log('Session joined:', session);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private checkSessionConnection(userId: number) {
    const sessionId = localStorage.getItem('connectedSessionId');
    if (sessionId) {
      this.sessionService.getSession(parseInt(sessionId)).subscribe(
        (session) => {
          if (session && session.users.some(participant => participant.id === userId)) {
            this.session = session;
            this.selectedSessionId = session.id;
            this.sessionService.setSession(session);
            this.loadPlaylist(session.id);
            console.log('User is already connected to session:', session);
          } else {
            localStorage.removeItem('connectedSessionId');
            console.log('User is not connected to this session or session does not exist.');
          }
        },
        (error) => {
          localStorage.removeItem('connectedSessionId');
          console.error('Error checking session connection:', error);
        }
      );
    }
  }
}
