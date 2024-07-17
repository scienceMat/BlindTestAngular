import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import { SpotifyService } from '../../core/services/spotifyService.service';
import { LecteurComponent } from '../lecteur/lecteur.component';
import { Session } from '../../core/models/session.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LecteurComponent],
  providers: [UserService, SessionService, SpotifyService],
})
export class AdminComponent implements OnInit {
  sessionName: string = '';
  sessions: any[] = [];
  session: Session | null = null;
  selectedSessionId: number | null = null;

  constructor(
    private userService: UserService,
    private sessionService: SessionService,
    private spotifyService: SpotifyService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSessions();
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
      this.sessionService.createSession({ name: this.sessionName, adminId: adminId }).subscribe((response) => {
        console.log('Session created:', response);
        this.loadSessions();
      });
    } else {
      console.error('User not found. Please log in first.');
    }
  }

  joinSession() {
    const userId = this.authService.currentUserValue?.id;
    if (userId && this.selectedSessionId) {
      this.sessionService.joinSession(this.selectedSessionId, userId).subscribe((response) => {
        this.sessionService.setSessionId(response.id);
        this.session = response;
        console.log('Joined session:', response);
      });
    }
  }

  startSession() {
    if (this.session) {
      this.sessionService.startSession(this.session.id).subscribe(response => {
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
