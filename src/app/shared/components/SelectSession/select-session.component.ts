import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SpotifyService} from '../../../core/services/spotifyService.service';
import {Subscription} from 'rxjs';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {UserService} from '../../../core/services/user.service';
import {SessionService} from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import {Session} from '../../../core/models/session.model';

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
export class SelectSession implements OnInit {
  @Input() sessions: Session[] | null = []; // Ajouter une propriété @Input() pour la session sélectionnée
  session: Session | null = null;
  userId: number | null | undefined; // Example user ID, you might want to get this dynamically
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


  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id;

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
