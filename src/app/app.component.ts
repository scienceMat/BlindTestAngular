import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, FooterComponent, HeaderComponent,]
})
export class AppComponent {
  title = 'BlindTestAngular';
}
