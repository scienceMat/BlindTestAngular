import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@services/user.service';
import { SessionService } from '@services/session.service';
import { WebSocketService } from '@services/web-socket.service';
import { AuthService } from '@services/auth.service';
import { Session } from '../../core/models/session.model';
import { User } from '../../core/models/user.model';
import { SelectSessionComponent } from '../../shared/components/SelectSession/select-session.component';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectSessionComponent],
  providers: [UserService, SessionService, WebSocketService],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit, OnDestroy {
  userName: string = '';
  selectedSessionId: number | null = null;
  session: Session | null = null;
  hasBuzzed: boolean = false;
  title: string = '';
  artist: string = '';
  sessions: Session[] = [];
  timeRemaining: number | null = null;
  intervalId: any = null;
  userId: number | undefined;
  sessionStarted: boolean = false;
  sessionPaused: boolean = false;
  showRanking: boolean = false;
  ranking: any[] = [];
  showSubmitButton: boolean = true;
  showCountdown: boolean = false;
  round: number = 1;
  private subscriptions = new Subscription();

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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnectSocket();
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
    this.sessionService.setSession(session);
    this.saveSessionConnection(session.id);
    console.log('Selected session:', session);
  
    // Reconnect to WebSocket for the new session
    this.webSocketService.disconnectSocket(); // Déconnecter de l'ancienne session
    this.initializeWebSocketConnection(); // Reconnecter avec la nouvelle session
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
          this.hasBuzzed = false;
          this.showSubmitButton = false;
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

  initializeWebSocketConnection(): void {
    this.subscriptions.add(
      this.webSocketService.connectSocket().subscribe(() => {
        if (this.session) {
          this.subscriptions.add(
            this.webSocketService.subscribeToSession(this.session.id).subscribe(
              (message) => this.handleWebSocketMessage(message),
              (error) => console.error('WebSocket error:', error)
            )
          );
        }
      })
    );
  }

  handleWebSocketMessage(message: string): void {
    console.log('Received WebSocket message:', message);
    if (message.startsWith('COUNTDOWN_')) {
      this.timeRemaining = parseInt(message.split('_')[1], 10);
      this.showCountdown = true;
      if (this.timeRemaining === 0) {
        this.showCountdown = false;
      }
    } else if (message === 'NEXT_TRACK' || message === 'PREVIOUS_TRACK') {
      this.sessionService.getSession(this.session!.id).subscribe((updatedSession) => {
        this.session = updatedSession;
        this.updateDOMForTrackChange(message);
      });
    } else if (message === 'START_SESSION') {
      this.sessionStarted = true;
      this.sessionPaused = false;
    } else if (message === 'SESSION_FINISHED') {
      this.sessionStarted = false;
    } else if (message === 'STOP_SESSION') {
      this.sessionStarted = false;
      this.sessionPaused = true;
    } else if (message === 'END_OF_ROUND') {
      this.sessionPaused = true;
      this.showRanking = true;
      setTimeout(() => {
        this.showRanking = false;
        this.sessionPaused = false;
        this.showSubmitButton = true;
        this.round++;
      }, 5000);
    } else if (message === 'NEXT_ROUND') {
      this.resetForNextRound();
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
  }

  resetForNextRound(): void {
    this.showSubmitButton = true;
    this.hasBuzzed = false;
  }



  updateDOMForTrackChange(direction: string): void {
    if (this.session) {
      const currentTrack = this.session.musicList[this.session.currentMusicIndex];
      const message = direction === 'NEXT_TRACK' ? 'Next round starting' : 'Previous round starting';
      this.displayTrackChangeNotification(message);
    }
  }

  displayTrackChangeNotification(message: string): void {
    // You can use a modal or any styled notification here.
    alert(message);
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
