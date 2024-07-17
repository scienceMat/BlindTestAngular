import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SpotifyService} from '../../../../core/services/spotifyService.service';
import {Subscription} from 'rxjs';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {UserService} from '../../../../core/services/user.service';
import {SessionService} from '../../../../core/services/session.service';
import { AuthService } from '../../../../core/services/auth.service';
import {Session} from '../../../../core/models/session.model';

@Component({
  selector: 'app-select-session',
  standalone: true,
  templateUrl: './select-session.component.html',
  styleUrls: ['./select-session.component.css'],
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    CommonModule, FormsModule
  ]
})
export class SelectSession implements OnInit, OnDestroy {
  sessions: any[] = [];
  @Input() session: Session | null = null; // Ajouter une propriété @Input() pour la session sélectionnée

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
  selectedSessionId: number | null = null;

  constructor(
    private spotifyService: SpotifyService,
    public userService: UserService,
    private sessionService: SessionService,
    private authService: AuthService
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

  private getHashParams(): { [key: string]: string } {
    const hash = window.location.hash.substring(1);
    return hash.split('&').reduce((acc, item) => {
      const parts = item.split('=');
      acc[parts[0]] = decodeURIComponent(parts[1]);
      return acc;
    }, {} as { [key: string]: string });
  }

  joinSession() {
    const userId = this.authService.currentUserValue?.id;
    if (userId && this.selectedSessionId) {
      this.sessionService.joinSession(this.selectedSessionId, userId).subscribe(response => {
        this.sessionService.setSessionId(response.id);
        this.session = response;
        console.log('Joined session:', response);
      });
    }
  }


}
