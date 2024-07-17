import { Component } from '@angular/core';
import { MusicService } from '../../core/services/music.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [MusicService]
})
export class MusicComponent {
  title: string = '';
  artist: string = '';
  file: File | null = null;

  constructor(private musicService: MusicService) { }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  uploadMusic() {
    if (this.file) {
      this.musicService.uploadMusic(this.file, this.title, this.artist).subscribe(response => {
        console.log('Music uploaded:', response);
      });
    }
  }
}
