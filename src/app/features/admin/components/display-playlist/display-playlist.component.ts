import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { TrackDTO } from '../../../../core/models/trackDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-display-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-playlist.component.html',
  styleUrl: './display-playlist.component.css'
})
export class DisplayPlaylistComponent {
@Input() playlist: TrackDTO[] = []

ngOnInit() {
}


}
