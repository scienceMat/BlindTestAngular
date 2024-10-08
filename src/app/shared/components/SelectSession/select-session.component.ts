import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpotifyService } from '../../../core/services/spotifyService.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/models/session.model';
import { User } from '../../../core/models/user.model'; // Import User model
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';

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
  @Output() sessionJoined = new EventEmitter<Session>(); // New EventEmitter

  selectedSessionId: number | null = null;
  userId: number | null = null;
  showErrorModal: boolean = false; // State to show or hide the error modal
  sessionUsers: User[] = []; // Array to hold users in the selected session

  constructor(
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id || null; // Ensure userId is explicitly set to null if undefined
    this.initializeSession();
  }

  initializeSession() {
    // Check if the user is already part of a session
    if (this.userId !== null) {
      this.sessionService.getSessionByUser(this.userId).subscribe(
        (session) => {
          if (session) {
            this.selectedSessionId = session.id;
            this.sessionSelected.emit(session);
          }
        },
        (error) => {
          console.log('User not part of any session or error occurred:', error);
        }
      );
    }
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

  loadSessionUsers(sessionId: number) {
    this.sessionService.getSession(sessionId).subscribe(
      (session) => {
        this.sessionUsers = session.users;
        console.log('Loaded session users:', this.sessionUsers);
      },
      (error) => {
        console.log('Error loading session users:', error);
      }
    );
  }

  joinSession() {
    // Check if the userId and selectedSessionId are valid numbers
    const userId = this.userId;
    const sessionId = this.selectedSessionId;

    if (userId !== null && sessionId !== null) {
      // Verify if the user is already in the selected session
      this.sessionService.getSession(sessionId).subscribe(
        (selectedSession) => {
          if (selectedSession.users.some(u => u.id === userId)) {
            // User is already in this session, navigate directly
            console.log('User is already in this session:', selectedSession);
            this.router.navigate(['/session-screen', sessionId]);
          } else {
            // User is not in this session yet, proceed to join
            this.joinSelectedSession(userId);
          }
        },
        (error) => {
          console.log('Error retrieving selected session:', error);
        }
      );
    } else {
      console.error('User ID or Session ID is invalid');
    }
  }

  joinSelectedSession(userId: number) {
    if (this.selectedSessionId === null) {
      console.error('No session selected');
      return;
    }

    const sessionId = this.selectedSessionId; // Ensure sessionId is a valid number

    // Attempt to join the session
    this.sessionService.joinSession(sessionId, userId).pipe(
      tap(response => {
        console.log('Join session response:', response);

        // Update the current session ID in the session service
        this.sessionService.setSessionId(response.id);
      }),
      // Switch to another observable that fetches the session details
      switchMap(() => this.sessionService.getSession(sessionId))
    ).subscribe(
      (session) => {
        // Verify that the user has been successfully added to the session
        if (session && session.users.some(participant => participant.id === userId)) {
          // Store the connected session ID in local storage
          localStorage.setItem('connectedSessionId', sessionId.toString());

          // Emit the joined session event
          this.sessionJoined.emit(session);

          // Navigate to the session screen after ensuring the user is part of the session
          console.log('User successfully joined and verified in session:', session);
          this.router.navigate(['/session-screen', sessionId]);

          this.showErrorModal = false;
        } else {
          console.warn('User is not yet in the session after join attempt.');
          // Handle case where user is not in the session despite join attempt
        }
      },
      (error) => {
        console.error('Error during session joining or verification:', error);
      }
    );
  }

  leaveSession(userId: number, sessionId: number) {
    this.sessionService.leaveSession(sessionId, userId).subscribe(
      (response) => {
        console.log('Left session:', response);
        this.router.navigate(["/admin"])
        // Update application state or perform other actions after leaving the session
      },
      (error) => {
        console.log('Error leaving session:', error);
        // Handle session leave errors here
      }
    );
  }

  // Method to close the error modal
  closeErrorModal() {
    this.showErrorModal = false;
  }
}
