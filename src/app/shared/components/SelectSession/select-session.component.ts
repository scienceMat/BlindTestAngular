import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpotifyService } from '../../../core/services/spotifyService.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/models/session.model';
import { User } from '../../../core/models/user.model'; // Import User model

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
  userId: number | null | undefined;
  showErrorModal: boolean = false; // State to show or hide the error modal
  sessionUsers: User[] = []; // Array to hold users in the selected session

  constructor(
    private spotifyService: SpotifyService,
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id;
    this.initializeSession();
  }

  initializeSession() {
    // Check if the user is already part of a session
    if (this.userId) {
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
    // Récupère l'ID de l'utilisateur connecté actuel
    const userId = this.authService.currentUserValue?.id;
    const user = this.authService.currentUserValue;

    // Vérifie si l'ID de l'utilisateur et l'ID de la session sélectionnée sont valides
    if (userId !== undefined && this.selectedSessionId !== null) {
        // Vérifie si l'utilisateur est déjà dans la session sélectionnée
        this.sessionService.getSession(this.selectedSessionId).subscribe(
            (selectedSession) => {
                if (selectedSession.users.some(u => u.id === userId)) {
                    // L'utilisateur est déjà dans cette session, donc nous allons le retirer
                    console.log('User is already in this session:', selectedSession);
                    this.leaveSession(userId, this.selectedSessionId as number);
                } else {
                    // L'utilisateur n'est pas encore dans cette session, donc nous allons le rejoindre
                    this.joinSelectedSession(userId);
                }
            },
            (error) => {
                // Gère les erreurs potentielles lors de la récupération de la session sélectionnée
                console.log('Error retrieving selected session:', error);
            }
        );
    } else {
        console.error('User ID or Session ID is invalid');
    }
}

joinSelectedSession(userId: number) {
  this.sessionService.joinSession(this.selectedSessionId as number, userId).subscribe(
      (response) => {
          // Met à jour l'ID de la session courante dans le service
          this.sessionService.setSessionId(response.id);
          console.log('Joined session:', response);
          this.showErrorModal = false;
          this.sessionJoined.emit(response); // Emit the event here

           // Réinitialise l'état d'erreur si réussi
      },
      (error) => {
          console.log('Error joining session:', error);
          // Vous pouvez gérer d'autres erreurs potentielles ici
      }
  );
}

leaveSession(userId: number, sessionId: number) {
  this.sessionService.leaveSession(sessionId, userId).subscribe(
      (response) => {
          console.log('Left session:', response);
          // Mettre à jour l'état de l'application ou effectuer d'autres actions après avoir quitté la session
      },
      (error) => {
          console.log('Error leaving session:', error);
          // Gérer les erreurs de sortie de la session ici
      }
  );
}

  // Method to close the error modal
  closeErrorModal() {
    this.showErrorModal = false;
  }
}
