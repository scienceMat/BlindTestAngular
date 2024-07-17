import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [SessionService]
})
export class SessionComponent {
  sessions: any[] = [];
  adminId: number = 1; // Assurez-vous d'utiliser l'adminId approprié pour votre application

  constructor(public sessionService: SessionService) {
    this.loadSessions();
  }

  loadSessions() {
    this.sessionService.getAllSessions().subscribe(response => {
      this.sessions = response;
    });
  }

  createSession(sessionName: string, adminId: number) {
    this.sessionService.createSession({name: sessionName, adminId: adminId}).subscribe(response => {
      console.log('Session created:', response);
      this.loadSessions(); // Refresh the list of sessions
    });
  }
}
