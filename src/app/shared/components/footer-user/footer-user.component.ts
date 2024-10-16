import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-footer-user',
  standalone: true,
  imports: [],
  templateUrl: './footer-user.component.html',
  styleUrl: './footer-user.component.css'
})
export class FooterUserComponent {
  @Input() userName!: string; // Nom de l'utilisateur connecté

}
