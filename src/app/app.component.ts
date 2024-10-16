import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import {AuthService} from '@services/auth.service';
import {HeaderUserComponent} from './shared/components/header-user/header-user.component';
import {FooterUserComponent} from './shared/components/footer-user/footer-user.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, FooterComponent, HeaderComponent, HeaderUserComponent, FooterUserComponent,CommonModule]
})
export class AppComponent {
  title = 'BlindTestAngular';
  isAdmin: boolean = false;
  sessionId: number = 123456; // ID de session fictif
  userName: string = 'Marc';  // Nom d'utilisateur fictif


  constructor(private authService: AuthService) {
    this.isAdmin = false;
    // this.isAdmin = this.authService.isAdmin(); // Récupère si l'utilisateur est admin ou non
  }

}
