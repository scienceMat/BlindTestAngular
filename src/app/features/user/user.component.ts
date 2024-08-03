import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@services/user.service';
import { SessionService } from '@services/session.service';
import { WebSocketService } from '@services/web-socket.service';
import { AuthService } from '@services/auth.service';
import { Session } from '../../core/models/session.model';
import { User } from '../../core/models/user.model';
import { SelectSessionComponent } from '../../shared/components/SelectSession/select-session.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule,SelectSessionComponent],
  providers: [UserService, SessionService, WebSocketService],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit {
  userName: string = '';
  selectedSessionId: number | null = null;
  session: Session | null = null;
  hasBuzzed: boolean = false;
  title: string = '';
  artist: string = '';
  sessions: Session[] = [];
  timeRemaining: number | null = null;
  intervalId: any = null;
  userId: number | undefined ;
  sessionStarted: boolean = false;
  sessionPaused: boolean = false;
  showRanking: boolean = false;
  ranking: any[] = [];
  showSubmitButton: boolean = true;

  constructor(
    public userService: UserService,
    public sessionService: SessionService,
    private webSocketService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id;
    if (this.userId) {
      this.checkSession();
    }
    this.loadSessions();
    this.initializeWebSocketConnection();
    this.sessionService.session$
  }

  loadSessions() {
    this.sessionService.getAllSessions().subscribe((response) => {
      this.sessions = response;
    });
  }

  createUser() {
    const user = { userName: this.userName };
    this.userService.createUser(user).subscribe((response) => {
      this.userService.setUserId(response.id);
      this.userId = response.id;
      console.log('User created:', response);
    });
  }

  onSessionSelected(session: Session) {
    this.selectedSessionId = session.id;
    this.sessionService.setSession(session); // Mettre à jour la session dans le service
    this.saveSessionConnection(session.id); // Save the connection to local storage
    console.log('Selected session:', session);
  }

  private saveSessionConnection(sessionId: number) {
    localStorage.setItem('connectedSessionId', sessionId.toString());
  }

  onSessionJoined(session: Session) {
    this.selectedSessionId = session.id;
    this.session = session;
    this.saveSessionConnection(session.id);
    console.log('Session joined:', session);
  }

  buzz() {
    this.hasBuzzed = true;
  }

  submitAnswer(title: string, artist: string) {
    if (this.session && this.session.id) {
      const answer = {
        userId: this.userId,
        title: title,
        artist: artist,
      };
      this.sessionService.submitAnswer(this.session.id, answer).subscribe(
        (response) => {
          console.log('Answer submitted', response);
          this.hasBuzzed = false; // Disable further answers
          this.showSubmitButton = false; // Hide the button after submission
        },
        (error) => {
          console.error('Error submitting answer', error);
        }
      );
    }
  }

  checkSession() {
    this.sessionService.getSessionByUser(this.userId!).subscribe((session) => {
      if (session) {
        this.session = session;
        this.sessionService.setSession(session);
        this.sessionStarted = this.session.status === 'in-progress';
        this.startTimer();
      }
    });
  }

  startTimer() {
    if (this.session && this.session.endTime) {
      const endTime = new Date(this.session.endTime).getTime();
      this.intervalId = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        this.timeRemaining = Math.floor(distance / 1000);
        if (distance < 0) {
          clearInterval(this.intervalId);
          this.timeRemaining = 0;
        }
      }, 1000);
    }
  }

  initializeWebSocketConnection() {
    this.webSocketService.connectSocket().subscribe(() => {
      this.webSocketService.subscribeToStart().subscribe(
        (message) => {
          console.log('Received data: ', message);
          if (message === 'START_SESSION') {
            this.sessionStarted = true;
            this.sessionPaused = false;
          } else if (message === 'END_OF_ROUND') {
            this.sessionPaused = true;
            this.showRanking = true;
            setTimeout(() => {
              this.showRanking = false;
              this.sessionPaused = false;
              this.showSubmitButton = true; // Show the button at the start of the next round
            }, 5000);
          } else if (message === 'NEXT_MUSIC') {
            this.sessionStarted = true;
            this.sessionPaused = false;
            this.hasBuzzed = false; // Allow buzzing for the new music
            this.showSubmitButton = true; // Show the button at the start of the next round
          } else if (message === 'SESSION_FINISHED') {
            this.sessionStarted = false;
            this.sessionPaused = false;
            // Display the final score
          } else {
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
        },
        (error) => console.error('WebSocket error:', error),
        () => console.log('WebSocket connection closed')
      );
    });
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionId');
    this.userService.setUserId(null);
    this.sessionService.setSessionId(null);
    this.session = null;
    this.selectedSessionId = null;
    this.userName = '';
    console.log('User logged out');
  }
}
