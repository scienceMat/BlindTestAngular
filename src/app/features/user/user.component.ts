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
import { Router } from '@angular/router';
import { SpotifyService } from '@services/spotifyService.service';

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
  private subscription: Subscription = new Subscription();
  public isConnected = false;
  public messages: string[] = [];

  constructor(
    public userService: UserService,
    public sessionService: SessionService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private router: Router,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit() {
    this.userId = this.authService.currentUserValue?.id;
    if (this.userId) {
      this.checkSession();
    }
    this.loadSessions();
    this.webSocketService.connectSocket();
    this.initializeWebSocketConnection(); // Reconnecter avec la nouvelle session

  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    this.webSocketService.disconnectSocket(); // Déconnecter proprement du WebSocket
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

    
  }

  private saveSessionConnection(sessionId: number) {
    localStorage.setItem('connectedSessionId', sessionId.toString());
  }

  leaveSession() {
    const sessionId = this.session?.id;
    if (sessionId) {
      this.sessionService.leaveSession(sessionId, this.userId as number).subscribe(() => {
        console.log('Left session');
        this.router.navigate(['/']); // Redirect to home or sessions list
      });
    }
  }

  onSessionJoined(session: Session) {
    if (this.session?.id !== session.id) {
      this.selectedSessionId = session.id;
      this.session = session;
      this.saveSessionConnection(session.id);

      // Nettoyage des abonnements avant de changer de session
      this.cleanupSubscriptions();
      this.webSocketService.disconnectSocket(); // Déconnecter de l'ancienne session

      this.initializeWebSocketConnection(); // Reconnecter avec la nouvelle session
      console.log('Session joined:', session);
    } else {
      console.log('Already connected to this session');
    }
  }

  private cleanupSubscriptions(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription(); // Reset for the new session
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
        artist: artist,
      };
  
      this.sessionService.submitAnswer(this.session.id, answer).subscribe(
        (response: any) => {
          console.log('Answer submitted', response);
  
          // Récupérer les scores dans la session renvoyée
          if (response && response.scores) {
            this.updateScores(response.scores);
          }
  
          this.showSubmitButton = false;
        },
        (error) => {
          console.error('Error submitting answer', error);
        }
      );
    }
  }
  
  updateScores(scores: { [userId: number]: number }) {
    // Transformer les scores en un tableau d'objets pour le ranking
    this.ranking = Object.entries(scores).map(([userId, score]) => ({
      userId: Number(userId),
      score: score
    }));
  
    console.log('Ranking updated:', this.ranking);
  }

  checkSession() {
    this.sessionService.getSessionByUser(this.userId!).subscribe((session) => {
      if (session) {
        this.session = session;
        this.sessionService.setSession(session);
        this.sessionStarted = this.session.status === 'in-progress';
      }
    });
    this.initializeWebSocketConnection();

  }


  private initializeWebSocketConnection(): void {
    
  // Vérifier que la session est sélectionnée avant d'essayer de se connecter
  if (this.sessionService.getSessionId()) {
    this.cleanupSubscriptions();
    this.subscription.add(
      this.webSocketService.getConnectionState().subscribe(isConnected => {
        this.isConnected = isConnected;
        if (isConnected) {
          // Utiliser l'ID de la session sélectionnée pour la souscription
          this.subscription.add(
            this.webSocketService.subscribeToSession(this.selectedSessionId!).subscribe(message => {
              console.log('Received message:', message);
              this.handleWebSocketMessage(message);
            })
          );
        }
      })
    );
  } else {
    console.error('No session selected, cannot initialize WebSocket connection.');
  }
}

startCountdown(time: number, nextMusic: boolean = false) {
  this.countdown = time;
  let interval = setInterval(() => {
    this.countdown--;
    if (this.countdown === 0) {
      clearInterval(interval);
      this.sessionStarted = true;
      this.showSubmitButton = true;
      this.sessionPaused = false;
      this.showCountdown = false;
      this.hasBuzzed = false;

      // Si l'action "NEXT_MUSIC" est demandée, on appelle nextTrack() à la fin du compte à rebours
      if (nextMusic) {
        this.nextTrack();
      }
    }
  }, 1000);
}

  handleWebSocketMessage(message: string): void {
    console.log('Received WebSocket message:', message);
    
    switch (message) {
      case 'PAUSE_MUSIC':
      this.pauseMusic();  // API Spotify pour mettre en pause la musique
      break;

      case 'START_SESSION':
        this.showCountdown = true;
        this.startCountdown(10);
        break;
      
      case 'END_OF_ROUND':
        this.showRanking = true;
        this.sessionPaused = true;
        setTimeout(() => {
          this.showRanking = false;
          this.sessionPaused = false;
          this.nextRound();  // Passer au round suivant après un délai
        }, 5000); // Afficher les scores pendant 5 secondes avant de les masquer
        break;
      
      case 'NEXT_MUSIC':
        this.round = this.round +1
        this.startCountdown(10, true);  // Lancer un compte à rebours et jouer la musique suivante à la fin
        break;
      
      case 'SESSION_FINISHED':
        this.sessionStarted = false;
        break;
      
      case 'STOP_SESSION':
        this.sessionStarted = false;
        break;
  
      default:
        this.handleScoreUpdates(message);
    }
  }

  pauseMusic(): void {
    this.spotifyService.pause().subscribe(() => {
      console.log('Music paused');
    });
  }
  
  nextTrack(): void {
    this.spotifyService.nextTrack().subscribe(() => {
      console.log('Next track is playing');
    });
  }

  nextRound(): void {
    this.sessionService.nextQuestion(this.selectedSessionId!).subscribe((response) => {
      console.log('Next round started');
      this.nextTrack();  // Jouer la musique suivante après la pause
    });
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
