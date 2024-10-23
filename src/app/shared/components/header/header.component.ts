import {Component, OnInit} from '@angular/core';
import {MenubarModule} from 'primeng/menubar';
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MenubarModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  items: MenuItem[] = [];  // Déclare le tableau items

  ngOnInit(): void {

    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: ['']  // Utilisation de routerLink
      },
      {
        label: 'PLay',
        icon: 'pi pi-play',
        routerLink: ['/users']  // Navigation vers la page Features
      },
      {
        label: 'Login',
        icon: 'pi pi-sign-in',
        routerLink: ['/login'],  // Lien vers la page Contact
      }
    ];
  }

}
