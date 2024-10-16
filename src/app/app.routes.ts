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
import { SessionScreenComponent } from './features/session-screen/session-screen.component';
import { CallbackComponent } from './features/callback/callback.component';

export const routes: Routes = [
  { path: '', component: UserComponent  },
  { path: 'login', component: AuthComponent },
  { path: 'loginSpotify', component: LoginSpotifyComponent},
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  { path: 'sessions', component: SessionComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'session-screen/:id', component: SessionScreenComponent, canActivate: [AdminGuard] }, // Add this route


];
