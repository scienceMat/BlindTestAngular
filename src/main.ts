import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Ajoutez cette ligne

const config: SocketIoConfig = { url: 'http://localhost:8080/ws', options: {} };

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(SocketIoModule.forRoot(config)),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule) // Ajoutez cette ligne
  ],
}).catch(err => console.error(err));
