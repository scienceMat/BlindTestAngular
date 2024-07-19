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

  constructor(private authService: AuthService, private router: Router) {}

  stateOptions = [
    { label: 'User', value: false },
    { label: 'Admin', value: true }
  ];

  login() {
    this.authService.login(this.userName, this.password).subscribe(user => {
      if (user) {
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
      alert('User created successfully!');
    });
  }
}
