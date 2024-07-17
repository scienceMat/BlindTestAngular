// user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { SessionService } from '../../core/services/session.service';
import { WebSocketService } from '../../core/services/web-socket.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [UserService, SessionService, WebSocketService],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  userName: string = '';
  selectedSessionId: number | null = null;
  session: any = null;
  hasBuzzed: boolean = false;
  title: string = '';
  artist: string = '';
  sessions: any[] = [];
  timeRemaining: number | null = null;
  intervalId: any = null;
  userId: number | null = null;
  sessionStarted: boolean = false;
  sessionPaused: boolean = false;
  showRanking: boolean = false;
  ranking: any[] = [];
  showSubmitButton: boolean = true; // Nouvelle variable pour gérer la visibilité du bouton

  constructor(
    public userService: UserService,
    public sessionService: SessionService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    this.loadSessions();
    this.userId = this.userService.getUserId();
    if (this.userId) {
      this.checkSession();
    }
    this.initializeWebSocketConnection();
  }

  loadSessions() {
    this.sessionService.getAllSessions().subscribe(response => {
      this.sessions = response;
    });
  }

  createUser() {
    const user = { userName: this.userName };
    this.userService.createUser(user).subscribe(response => {
      this.userService.setUserId(response.id);
      this.userId = response.id;
      console.log('User created:', response);
    });
  }

  joinSession() {
    if (this.userId && this.selectedSessionId) {
      this.sessionService.joinSession(this.selectedSessionId, this.userId).subscribe(response => {
        this.sessionService.setSessionId(response.id);
        this.session = response;
        this.sessionStarted = this.session.status === 'in-progress';
        this.startTimer();
        console.log('Joined session:', response);
      });
    }
  }

  buzz() {
    this.hasBuzzed = true;
  }

  submitAnswer(title: string, artist: string) {
    if (this.session && this.session.id) {
      const answer = {
        userId: this.userId,
        title: title,
        artist: artist
      };
      this.sessionService.submitAnswer(this.session.id, answer).subscribe(response => {
        console.log('Answer submitted', response);
        this.hasBuzzed = false; // Disable further answers
        this.showSubmitButton = false; // Masquer le bouton après la soumission
      }, error => {
        console.error('Error submitting answer', error);
      });
    }
  }

  checkSession() {
    const sessionId = this.sessionService.getSessionId();
    if (sessionId) {
      this.sessionService.getAllSessions().subscribe(sessions => {
        this.session = sessions.find((session: any) => session.id === sessionId) || null;
        if (this.session) {
          this.sessionStarted = this.session.status === 'in-progress';
          this.startTimer();
        }
      });
    }
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
              this.showSubmitButton = true; // Réafficher le bouton au début du prochain tour
            }, 5000);
          } else if (message === 'NEXT_MUSIC') {
            this.sessionStarted = true;
            this.sessionPaused = false;
            this.hasBuzzed = false; // Allow buzzing for the new music
            this.showSubmitButton = true; // Réafficher le bouton au début du prochain tour
          } else if (message === 'SESSION_FINISHED') {
            this.sessionStarted = false;
            this.sessionPaused = false;
            // Afficher le score final
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
