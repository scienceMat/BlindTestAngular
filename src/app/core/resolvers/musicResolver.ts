import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { Observable, of } from 'rxjs';
import {TrackDTO} from '../models/trackDTO';

export const musicResolver: ResolveFn<Observable<TrackDTO[]>> = (route: ActivatedRouteSnapshot) => {
  const sessionService = inject(SessionService);
  let sessionId: number | null = null;

  // Essayer de récupérer l'ID de session depuis SessionService
  sessionId = sessionService.getSessionId();

  // Si pas trouvé, essayer de récupérer depuis localStorage
  if (!sessionId) {
    const sessionIdFromStorage = localStorage.getItem('sessionId');
    if (sessionIdFromStorage) {
      sessionId = Number(sessionIdFromStorage);
    }
  }

  if (sessionId === null) {
    return of([]);  // ou gérer l'erreur autrement
  }

  return sessionService.getPlaylist(sessionId);
};
