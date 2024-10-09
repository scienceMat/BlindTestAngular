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
  countdown: number = 0;
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
      }
    });
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

  startCountdown(time: number) {
    this.countdown = time;
    let interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.sessionStarted = true;
        this.showCountdown = false;
      }
    }, 1000);
  }

  handleWebSocketMessage(message: string): void {
    console.log('Received WebSocket message:', message);
    switch (message) {
      case 'START_SESSION':
        this.showCountdown = true;
        this.startCountdown(10); // Par exemple, 10 secondes avant démarrage
        break;
      case 'END_OF_ROUND':
        this.showRanking = true;
        setTimeout(() => {
          this.showRanking = false;
        }, 5000);
        break;
      case 'NEXT_MUSIC':
        this.startCountdown(10); // Par exemple, 10 secondes avant démarrage
        break;
      case 'SESSION_FINISHED':
        this.sessionStarted = false;
        // Finaliser l'affichage des scores finaux
        break;
      case 'STOP_SESSION':
        this.sessionStarted = false;
        break;
      case 'SCORE_UPDATE':
        this.handleScoreUpdates(message);
        break;
      default:
        this.handleScoreUpdates(message);
    }
  }


  //TODO Récuprer les infos via une api REST entre chaque round
  handleScoreUpdates(message: string) {
    // Supposons que le message ait le format 'SCORE_UPDATE:userId:score'
    const [eventType, userId, score] = message.split(':');
    // Mettre à jour le classement ou autres éléments dynamiques
    const userIndex = this.ranking.findIndex(user => user.name === userId);
    if (userIndex !== -1) {
      this.ranking[userIndex].score = parseInt(score, 10);
    } else {
      this.ranking.push({ name: userId, score: parseInt(score, 10) });
    }
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
