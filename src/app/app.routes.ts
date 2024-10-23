import {Routes} from '@angular/router';
import {AuthComponent} from './features/auth/auth.component';
import {AdminComponent} from './features/admin/admin.component';
import {AdminGuard} from './core/guards/admin.guard';
import {UserComponent} from './features/user/user.component';
import {LoginSpotifyComponent} from './login-spotify/login-spotify.component';
import {SessionScreenComponent} from './features/session-screen/session-screen.component';
import {CallbackComponent} from './features/callback/callback.component';
import {JoinSessionComponent} from './features/join-session/join-session.component';

export const routes: Routes = [
  {path: '', redirectTo: 'join', pathMatch: 'full'},
  {path: 'login', component: AuthComponent},
  {path: 'join', component: JoinSessionComponent},
  {path: 'loginSpotify', component: LoginSpotifyComponent},
  {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  {path: 'users/:sessionCode', component: UserComponent},
  {path: 'callback', component: CallbackComponent},
  {path: 'session-screen/:id', component: SessionScreenComponent, canActivate: [AdminGuard]}, // Add this route

];
