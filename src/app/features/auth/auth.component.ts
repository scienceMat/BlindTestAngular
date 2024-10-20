import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputTextComponent } from '../../shared/components/input/input.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { UserService } from '@services/user.service';
import { LoginResponse } from '../../core/models/user.model';
import { User,UserResponse } from '../../core/models/user.model';
import { SessionService } from '@services/session.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TabViewModule, ToggleButtonModule, InputTextComponent, SelectButtonModule,InputSwitchModule]
})
export class AuthComponent {
  userName: string = '';
  userGuestName: string = '';
  sessionCode: string = '';
  password: string = '';
  isAdmin: boolean = false;
  activeIndex: number = 0;

  constructor(private authService: AuthService,
     private router: Router,
      private userService: UserService, private sessionService: SessionService) {}

  stateOptions = [
    { label: 'User', value: false },
    { label: 'Admin', value: true }
  ];

  loginAsAdmin() {
    this.authService.login(this.userName, this.password).subscribe({
      next: (response: UserResponse) => {
        const user: User = {
          id: response.id,
          userName: response.username,
          password: '',
          isAdmin: response.admin
        };
  
        this.authService.setUserInLocalStorage(user);
        this.authService.setTokenInLocalStorage(response.token);
        this.authService.setCurrentUser(user);
  
        if (user.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          console.error('This user is not an admin');
        }
      },
      error: (err) => {
        console.error('Error during admin login:', err);
      }
    });
  }

  joinSessionAsUser() {
    if (!this.userGuestName || !this.sessionCode) {
      console.error('Pseudo or Session Code is missing');
      return;
    }
  
    // Appeler directement la méthode joinSessionAsGuest avec le pseudo et le code de session
    this.sessionService.joinSessionAsGuest(this.sessionCode, this.userGuestName).subscribe({
      next: (session) => { 
        // Stocker l'ID de session et le code de session
        this.sessionService.setSessionCode(this.sessionCode);
        this.authService.setCurrentUserGuest(this.userGuestName);
        // Rediriger l'utilisateur vers l'écran de la session
        this.router.navigate(['/users', this.sessionCode]);
      },
      error: (err) => {
        console.error('Error joining session:', err);
      }
    });
  }

  createAdmin() {
    this.authService.createUser({ userName: this.userName, password: this.password, isAdmin: true }).subscribe({
      next: () => {
        alert('Admin created successfully!');
      },
      error: (err) => {
        console.error('Error during admin creation:', err);
      }
    });
  }
}
