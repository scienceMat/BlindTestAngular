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
import { ActivatedRoute } from '@angular/router';

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
  selectedSessionId: string | null = null;
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
  private sessionCode: string | null = null;

  constructor(
    public userService: UserService,
    public sessionService: SessionService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private router: Router,
    private spotifyService: SpotifyService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const guestUser = this.authService.getCurrentUserGuest();
    if(guestUser){
      this.userName = guestUser;
    }
    this.sessionCode = this.route.snapshot.paramMap.get('sessionCode');
    if(this.sessionCode){
      this.sessionService.getSessionByCode(this.sessionCode).subscribe((session: Session)=> {
        this.selectedSessionId= session.id;
      })
    }
  
    if (this.sessionCode) {
      // Appel à l'API pour récupérer la session via le code
      this.sessionService.getSessionByCode(this.sessionCode).subscribe({
        next: (session) => {
          this.session = session;
          console.log('Session récupérée:', this.session);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de la session:', err);
        }
      });
    } else {
      console.error('Aucun code de session trouvé dans l\'URL');
    }

    this.webSocketService.connectSocket();
    this.initializeWebSocketConnection(); // Reconnecter avec la nouvelle session
// Simuler un utilisateur connecté
    // this.userId = 1; // User ID simulé
    // this.userName = 'John Doe'; // Nom d'utilisateur simulé

    // // Simuler une liste de sessions
    // this.sessions = [
    //   {
    //     id: 1,
    //     name: 'Session 1',
    //     adminId: 1,
    //     users: [
    //       { id: 1, userName: 'John Doe', isAdmin: true, password:"mdp" },
    //       { id: 2, userName: 'Jane Doe', isAdmin: false,password:"mdp" },
    //     ],
    //     musicList: [],
    //     scores: { 1: 100, 2: 80 },
    //     currentMusicIndex: 0,
    //     status: 'in-progress',
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 3600000), // 1 heure après le début
    //     questionStartTime: new Date(),
    //   },
    //   {
    //     id: 2,
    //     name: 'Session 2',
    //     adminId: 2,
    //     users: [{ id: 3, userName: 'Jim Beam', isAdmin: false,password:"mdp"  }],
    //     musicList: [],
    //     scores: { 3: 60 },
    //     currentMusicIndex: 0,
    //     status: 'question',
    //     startTime: new Date(),
    //     endTime: new Date(new Date().getTime() + 3600000),
    //     questionStartTime: new Date(),
    //   }
    // ];

    // Simuler une session sélectionnée
    // this.selectedSessionId = this.sessions[0].id; // Session par défaut sélectionnée
    // this.session = this.sessions[1]; // Simuler que la première session est active

    // // Simuler une connexion WebSocket fictive
    // this.webSocketService.connectSocket();
    // this.initializeWebSocketConnection(); // Initialiser avec la session simulée
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    this.webSocketService.disconnectSocket(); // Déconnecter proprement du WebSocket
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
        userName: this.userName,  // Utiliser le nom de l'utilisateur
        title: title,
        artist: artist
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
  this.showCountdown = true;
  if(this.session){
    this.session.status = 'in-progress';
  }
  let interval = setInterval(() => {
    this.countdown--;
    if (this.countdown === 0) {
      clearInterval(interval);
      this.sessionStarted = true;  // Active la session
      this.showSubmitButton = true;
      this.sessionPaused = false;
      this.showCountdown = false;
      this.hasBuzzed = false;
     
      // Mettre à jour le statut de la session après la fin du compte à rebours

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
      // Forcer la mise à jour du statut après réception du message
      
      this.startCountdown(10);  // Démarrer le compte à rebours de 10 secondes
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
      this.updateSessionStatus();  // Met à jour la session avant de jouer la musique suivante
      this.round += 1;
      this.startCountdown(10, true);  // Lancer un compte à rebours et jouer la musique suivante à la fin
      break;

    case 'SESSION_FINISHED':
      this.sessionStarted = false;
      break;

    case 'STOP_SESSION':
      this.updateSessionStatus();  // Met à jour le statut pour la fin du round
      this.sessionStarted = false;
      break;

    default:
      this.handleScoreUpdates(message);
  }
}

updateSessionStatus(): void {
  if (this.sessionCode) {
    this.sessionService.getSessionByCode(this.sessionCode).subscribe({
      next: (session: Session) => {
        this.session = session;  // Met à jour la session avec les dernières informations

        // Gérer le statut de la session ici
        if (this.session.status === 'in-progress') {
          this.sessionStarted = true;
          this.sessionPaused = false;
        } else if (this.session.status === 'pause') {
          this.sessionPaused = true;
        } else if (this.session.status === 'waiting') {
          this.sessionStarted = false;
          this.sessionPaused = false;
        }

        console.log('Session mise à jour:', this.session);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la session:', err);
      }
    });
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
