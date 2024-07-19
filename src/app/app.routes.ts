import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { AdminComponent } from './features/admin/admin.component';
import { SessionComponent } from './features/session/session.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { LecteurComponent } from './features/lecteur/lecteur.component';
import { UserComponent } from './features/user/user.component';
import { musicResolver } from '../../src/app/core/resolvers/musicResolver';
import { LoginSpotifyComponent } from './login-spotify/login-spotify.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'loginSpotify', component: LoginSpotifyComponent},
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  { path: 'sessions', component: SessionComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'callback', component: LecteurComponent },

];
