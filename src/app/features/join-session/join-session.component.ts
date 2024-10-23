import {Component} from '@angular/core';
import {AuthService} from '@services/auth.service';
import {SessionService} from '@services/session.service';
import {Router} from '@angular/router';
import {InputTextComponent} from '../../shared/components/input/input.component';
import {FormsModule} from '@angular/forms';
import {TabViewModule} from 'primeng/tabview';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [
    InputTextComponent,
    FormsModule,
    TabViewModule
  ],
  templateUrl: './join-session.component.html',
  styleUrl: './join-session.component.css'
})
export class JoinSessionComponent {
  userGuestName: string = '';
  sessionCode: string = '';
  activeIndex: number = 0;
  constructor(private authService: AuthService, private sessionService: SessionService, private router: Router) {
  }

  joinSessionAsUser() {
    if (!this.userGuestName || !this.sessionCode) {
      console.error('Pseudo or Session Code is missing');
      return;
    }

    // Vérifier si un utilisateur avec le même pseudo est déjà connecté
    const existingGuest = this.authService.getCurrentUserGuest();

    // Si le même pseudo est trouvé et que le token correspond, on reconnecte
    if (existingGuest && existingGuest.username === this.userGuestName) {
      console.log('User already connected as guest:', existingGuest);
      this.router.navigate(['/users', this.sessionCode]); // Reconnexion à la session
      return;
    }

    // Appeler la méthode joinSessionAsGuest avec le pseudo, le code de session et un token généré
    const sessionToken = this.generateSessionToken();  // Générer un token unique pour cet utilisateur invité
    this.sessionService.joinSessionAsGuest(this.sessionCode, {userName: this.userGuestName, sessionToken}).subscribe({
      next: (session) => {
        // Stocker le pseudo et le token dans le sessionStorage
        this.authService.setCurrentUserGuest(this.userGuestName, sessionToken);
        this.sessionService.setSessionCode(this.sessionCode);

        // Rediriger l'utilisateur vers l'écran de la session
        this.router.navigate(['/users', this.sessionCode]);
      },
      error: (err) => {
        console.error('Error joining session:', err);
      }
    });
  }


  private generateSessionToken(): string {
    return Math.random().toString(36).substr(2);  // Génère un token simple
  }
}
