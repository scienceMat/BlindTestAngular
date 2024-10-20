import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-header-user',
  standalone: true,
  imports: [],
  templateUrl: './header-user.component.html',
  styleUrl: './header-user.component.css'
})
export class HeaderUserComponent {
  @Input() sessionId!:  string | null; // ID de la session

}
