import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { SpotifyService } from '@services/spotifyService.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private spotifyService: SpotifyService) {}

  canActivate(): boolean {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.isAdmin) {
      if (this.authService.isAuthenticated() && this.authService.isSpotifyTokenValid()) {
        return true;
      } else {
        this.router.navigate(['/loginSpotify']);
        return false;
      }
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
