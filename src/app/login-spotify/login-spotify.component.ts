import { Component } from '@angular/core';
import { LoginButton } from "../shared/components/LoginButton/login-button.component";

@Component({
  selector: 'app-login-spotify',
  standalone: true,
  imports: [LoginButton],
  templateUrl: './login-spotify.component.html',
  styleUrl: './login-spotify.component.css'
})
export class LoginSpotifyComponent {

}
