import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AuthComponent {
  userName: string = '';
  password: string = '';
  isAdmin: boolean = false;

  constructor(private authService: AuthService,
     private router: Router,
    private userService: UserService) {}

  login() {
    this.authService.login(this.userName, this.password).subscribe(user => {
      if (user) {
        this.userService.setUserId(user.id);
        if (user.isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/users']);
        }
      } else {
        console.error('Login failed');
      }
    });
  }

  createUser() {
    this.authService.createUser({ userName: this.userName, password: this.password, isAdmin: this.isAdmin }).subscribe(user => {
      this.userService.setUserId(user.id)
      alert('User created successfully!');
    });
  }

  logout() {
    this.authService.logout();
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }
}
