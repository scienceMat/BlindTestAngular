import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { Session } from '../../core/models/session.model';
import { TrackDTO } from '../../core/models/trackDTO';
import { User } from '../../core/models/user.model';
import { LecteurComponent } from '../lecteur/lecteur.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-screen',
  standalone: true,
  templateUrl: './session-screen.component.html',
  styleUrls: ['./session-screen.component.css'],
  imports: [LecteurComponent,FormsModule,CommonModule]
})
export class SessionScreenComponent implements OnInit {
  session: Session | null = null;
  playlist: TrackDTO[] = [];
  currentTrack: TrackDTO | undefined ;
  scores: { user: User, score: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.loadSession(parseInt(sessionId));
    }
  }

  loadSession(sessionId: number) {
    this.sessionService.getSession(sessionId).subscribe((session) => {
      this.session = session;
      this.playlist = session.musicList;
      this.currentTrack = session.currentMusic;
      this.scores = this.mapScores(session.scores);
      console.log('Loaded session:', session);
    });
  }

  mapScores(scoreMap: { [key: number]: number }): { user: User, score: number }[] {
    return Object.entries(scoreMap).map(([userId, score]) => ({
      user: this.session?.users.find(u => u.id === +userId) as User,
      score: score
    }));
  }
}
