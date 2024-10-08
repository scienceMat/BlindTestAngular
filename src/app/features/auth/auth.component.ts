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

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TabViewModule, ToggleButtonModule, InputTextComponent, SelectButtonModule,InputSwitchModule]
})
export class AuthComponent {
  userName: string = '';
  password: string = '';
  isAdmin: boolean = false;
  activeIndex: number = 0;

  constructor(private authService: AuthService, private router: Router, private userService: UserService) {}

  stateOptions = [
    { label: 'User', value: false },
    { label: 'Admin', value: true }
  ];

  login() {
    this.authService.login(this.userName, this.password).subscribe({
      next: (response: UserResponse) => {
        const user: User = {
          id: response.id,
          userName: response.username,
          password: '', // Ne pas stocker le mot de passe
          isAdmin: response.admin
        };
  
        this.authService.setUserInLocalStorage(user);
        this.authService.setTokenInLocalStorage(response.token);
        this.authService.setCurrentUser(user);
  
        console.log("User ID:", user.id);
        if (user.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/users']);
        }
      },
      error: (err: any) => {
        console.error('Error during login:', err);
      }
    });
  }

  createUser() {
    this.authService.createUser({ userName: this.userName, password: this.password, isAdmin: this.isAdmin }).subscribe(user => {
      alert('User created successfully!');
    });
  }
}
