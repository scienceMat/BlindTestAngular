import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SpotifyService } from '../../core/services/spotifyService.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';
import { Session } from '../../core/models/session.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginButton } from '../../shared/components/LoginButton/login-button.component';
import { SelectSessionComponent } from '../../shared/components/SelectSession/select-session.component';
import { InputTextComponent } from '../../shared/components/input/input.component';
import { PlaylistService } from '../../core/services/utils/playlistService';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoginButton,
    InputTextComponent,
    SelectSessionComponent
  ],
  providers: [UserService, SessionService, SpotifyService, InputTextComponent],
})
export class AdminComponent implements OnInit {
  sessionName: string = '';
  sessions: Session[] = [];
  selectedSessionId: string | null = null;
  connected: boolean = false;
  sessionStarted: boolean = false;
  sessionPaused: boolean = false;
  showRanking: boolean = false;
  hasBuzzed: boolean = false;
  activeTab: string = 'blind-tests'; // Définit l'onglet actif

  ranking: any[] = [];
  showSubmitButton: boolean = true;
  constructor(
    private authService: AuthService,
    private router: Router,
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef,
    private playlistService: PlaylistService,
  ) {}

  ngOnInit() {
    const params = this.getHashParams();

  
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.isAdmin) {
      const token = localStorage.getItem('spotify_token');
      if (token == null) {
        const newToken = params['access_token'];
        this.spotifyService.setAccessToken(newToken);
      }

      if (!!token && token !== 'undefined') {
        this.connected = true;
        this.spotifyService.setAccessToken(token);
        this.spotifyService.initializePlayer(token); // Ensure player is initialized only once
        this.loadSessions();
        // Check if the user is already connected to a session
        // this.checkSessionConnection(currentUser.id);
      } else {
        this.redirectToSpotifyLogin();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Ouvrir un blind test
  openBlindTest(blindTestId: string) {
    this.router.navigate(['/session-screen', blindTestId]);
  }

  private getHashParams(): { [key: string]: string } {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {} as { [key: string]: string });
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

  navigateToCreateBlindTest() {
    this.activeTab = 'create-blind-test';
  }

  navigateToBlindTests() {
    this.activeTab = 'blind-tests';
  }

  createSession() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      const adminId = currentUser.id;
      this.sessionService.createSession({ name: this.sessionName, adminId: adminId })
        .pipe(
          switchMap((createdSession) => {
            this.activeTab = 'blind-tests'; // Retourner à l'onglet Blind Tests après création
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

  private saveSessionConnection(sessionId: string) {
    localStorage.setItem('connectedSessionId', sessionId.toString());
  }

  onSessionSelected(session: Session) {
    this.selectedSessionId = session.id;
    this.saveSessionConnection(session.id); // Save the connection to local storage
    console.log('Selected session:', session);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private checkSessionConnection(userId: number) {
    const sessionId = localStorage.getItem('connectedSessionId');
    if (sessionId) {
      this.sessionService.getSession(sessionId).subscribe(
        (session) => {
          if (session && session.users.some(participant => participant.id === userId)) {
            this.selectedSessionId = session.id;
            this.sessionService.setSession(session);
            console.log('User is already connected to session:', session);
            this.router.navigate(['/session-screen', this.selectedSessionId]);
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
