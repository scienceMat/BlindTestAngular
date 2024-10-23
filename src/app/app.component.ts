import {Component, OnInit} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {AuthService} from '@services/auth.service';
import {HeaderUserComponent} from './shared/components/header-user/header-user.component';
import {HeaderComponent} from './shared/components/header/header.component';
import {FooterUserComponent} from './shared/components/footer-user/footer-user.component';
import {FooterComponent} from './shared/components/footer/footer.component';
import {CommonModule} from '@angular/common';
import {SessionService} from '@services/session.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [HeaderComponent, HeaderUserComponent, FooterComponent, FooterUserComponent, CommonModule, RouterOutlet]
})
export class AppComponent implements OnInit {
  protected title = 'BlindTestAngular';
  protected isAdmin: boolean = false;
  protected isLoginRoute: boolean = false;
  protected sessionCode: string | null = null;
  protected userName: string = '';
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    // S'abonner aux utilisateurs enregistrés
    this.subscription.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          this.userName = user.userName;
          this.isAdmin = user.isAdmin;
        } else {
          this.userName = '';
          this.isAdmin = false;
        }
      })
    );

    // Gestion des invités
    this.subscription.add(
      this.authService.currentUserGuestSubject.subscribe(guest => {
        if (guest) {
          this.userName = guest.username;
          this.isAdmin = false;
        }
      })
    );

    // Gérer la session actuelle
    this.sessionCode = this.sessionService.getSessionCode();
    if (!this.sessionCode) {
      this.sessionCode = sessionStorage.getItem('sessionCode');
    }

    if (this.sessionCode) {
      this.sessionService.setSessionCode(this.sessionCode);
    }

    // Mise à jour de la route active
    this.router.events.subscribe((event: any) => {
      if (event.url) {
        this.isLoginRoute = event.url === '/login';
      }
    });
  }
}
