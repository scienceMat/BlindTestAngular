import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './bouton.component.html',
  styleUrls: ['./bouton.component.css']
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';  
  @Input() class: string = '';  
  @Input() type: string = 'button';
  @Input() style: { [key: string]: string } = {};
}
