import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor'; // Assurez-vous du bon chemin d'importation
import { HTTP_INTERCEPTORS } from '@angular/common/http';
const config: SocketIoConfig = { url: 'http://localhost:8080/ws', options: {} };

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(SocketIoModule.forRoot(config)),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // Ajoutez l'intercepteur via DI
    importProvidersFrom(BrowserAnimationsModule),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // Ajouter l'intercepteur ici
  ],
}).catch(err => console.error(err));
