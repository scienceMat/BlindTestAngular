import { Component,OnInit  } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import {AuthService} from '@services/auth.service';
import {HeaderUserComponent} from './shared/components/header-user/header-user.component';
import {FooterUserComponent} from './shared/components/footer-user/footer-user.component';
import {CommonModule} from '@angular/common';
import { SessionService } from '@services/session.service'; // Ajoute l'import du service Session
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, FooterComponent, HeaderComponent, HeaderUserComponent, FooterUserComponent,CommonModule]
})
export class AppComponent implements OnInit {
  title = 'BlindTestAngular';
  isAdmin: boolean = false;
  sessionCode: string | null = null; // Utilise sessionCode à la place de sessionId
  userName: string = '';  // Nom d'utilisateur
  private subscription: Subscription = new Subscription(); // Pour gérer les abonnements

  constructor(
    private authService: AuthService,
    private sessionService: SessionService // Injecte le service Session
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur enregistré
    this.subscription.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          this.userName = user.userName; // Met à jour le nom d'utilisateur
          this.isAdmin = user.isAdmin; // Vérifie si l'utilisateur est admin
        } else {
          this.userName = ''; // Réinitialise si pas d'utilisateur enregistré
          this.isAdmin = false;
        }
      })
    );

    // S'abonner aux changements d'utilisateur invité
    this.subscription.add(
      this.authService.currentUserGuestSubject.subscribe(guest => {
        if (guest) {
          this.userName = guest; // Met à jour le nom d'utilisateur invité
          this.isAdmin = false; // Un invité n'est pas admin
        }
      })
    );

    // Récupère le sessionCode depuis le SessionService
    this.sessionCode = this.sessionService.getSessionCode(); // Session stockée dans localStorage ou par session

    // Si le sessionCode est absent, tente de le charger depuis localStorage
    if (!this.sessionCode) {
      this.sessionCode = localStorage.getItem('sessionCode');
    }

    // Stocke le sessionCode dans le localStorage pour persistance
    if (this.sessionCode) {
      this.sessionService.setSessionCode(this.sessionCode);
    }
  }

  ngOnDestroy(): void {
    // Se désabonner lors de la destruction du composant
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}