import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { catchError } from 'rxjs/operators';
import { User } from '../../core/models/user.model';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const currentUser: User | null = this.authService.currentUserValue;
    console.log(currentUser);
    console.log(currentUser?.isAdmin)
    // Vérifie si l'utilisateur est un admin
    if (currentUser && currentUser.isAdmin) {
      const spotifyToken = localStorage.getItem('spotify_token');
      const spotifyTokenExpiration = localStorage.getItem('spotify_token_expiration');
      const now = new Date().getTime();

      // Vérification du token Spotify pour les admins uniquement
      if (!spotifyToken || !spotifyTokenExpiration || now > parseInt(spotifyTokenExpiration)) {
        // Si le token Spotify a expiré ou est manquant, rediriger vers la page de connexion Spotify
        this.authService.redirectToSpotifyLogin();
        return throwError('Spotify token expired or missing');
      }
    }

    // Ajouter le token JWT aux requêtes si présent
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(cloned).pipe(
        catchError(error => {
          if (error.status === 401) {
            // Si une requête retourne une erreur 401 (Unauthorized), vérifier si c'est un problème de token
            this.authService.logout();
          }
          return throwError(error);
        })
      );
    }

    return next.handle(req);
  }
}
