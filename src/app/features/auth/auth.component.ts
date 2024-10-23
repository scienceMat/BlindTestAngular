import {Component} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TabViewModule} from 'primeng/tabview';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {InputTextComponent} from '../../shared/components/input/input.component';
import {SelectButtonModule} from 'primeng/selectbutton';
import {InputSwitchModule} from 'primeng/inputswitch';
import {User, UserResponse} from '../../core/models/user.model';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TabViewModule, ToggleButtonModule, InputTextComponent, SelectButtonModule, InputSwitchModule]
})
export class AuthComponent {
  userName: string = '';
  userGuestName: string = '';
  sessionCode: string = '';
  password: string = '';
  isAdmin: boolean = false;
  activeIndex: number = 0;

  constructor(private authService: AuthService,
              private router: Router) {
  }

  loginAsAdmin() {
    this.authService.login(this.userName, this.password).subscribe({
      next: (response: UserResponse) => {
        const user: User = {
          id: response.id,
          userName: response.username,
          password: '',
          isAdmin: response.admin
        };

        this.authService.setUserInSessionStorage(user);
        this.authService.setTokenInSessionStorage(response.token);
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


  createAdmin() {
    this.authService.createUser({userName: this.userName, password: this.password, isAdmin: true}).subscribe({
      next: () => {
        alert('Admin created successfully!');
      },
      error: (err) => {
        console.error('Error during admin creation:', err);
      }
    });
  }
}
