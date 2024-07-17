import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { QuizService } from '../../core/services/quiz.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class QuizComponent implements OnInit {
  question: any;
  selectedTheme: string = 'rap';
  userId: number = 1; // L'id de l'utilisateur connecté, à obtenir dynamiquement si nécessaire
  title: string = '';
  artist: string = '';

  constructor(private quizService: QuizService) { }

  ngOnInit(): void {
    this.loadQuestion();
  }

  loadQuestion() {
    this.quizService.getQuestion(this.selectedTheme).subscribe(data => {
      this.question = data;
    });
  }

  submitAnswer() {
    this.quizService.submitAnswer(this.userId, this.question.id, this.title, this.artist).subscribe(response => {
      if (response) {
        alert('Bonne réponse!');
      } else {
        alert('Mauvaise réponse, essayez encore.');
      }
    });
  }
}
