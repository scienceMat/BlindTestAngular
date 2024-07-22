import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { SpotifyService } from '../../../core/services/spotifyService.service';
import { Subscription } from 'rxjs';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/models/session.model';

@Component({
  selector: 'app-select-session',
  standalone: true,
  templateUrl: './select-session.component.html',
  styleUrls: ['./select-session.component.css'],
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    CommonModule,
    FormsModule
  ]
})
export class SelectSessionComponent implements OnInit {
  @Input() sessions: Session[] | null = [];
  @Output() sessionSelected = new EventEmitter<Session>();
  selectedSessionId: number | null = null;
  userId: number | null | undefined; // Example user ID, you might want to get this dynamically

  constructor(
    private spotifyService: SpotifyService,
    public userService: UserService,
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id;
  }

  selectSession(session: Session) {
    this.selectedSessionId = session.id;
    this.sessionSelected.emit(session);
  }
  
  onSessionChange() {
    const selectedSession = this.sessions?.find(session => session.id === this.selectedSessionId) || null;
    if (selectedSession) {
      this.sessionSelected.emit(selectedSession);
    }
  }

  joinSession() {
    const userId = this.authService.currentUserValue?.id;
    if (userId && this.selectedSessionId) {
      this.sessionService.joinSession(this.selectedSessionId, userId).subscribe(response => {
        this.sessionService.setSessionId(response.id);
        console.log('Joined session:', response);
      });
    }
  }
}
