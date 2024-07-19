import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { TabPanel } from 'primeng/tabview';

@Component({
  selector: 'app-tab-view',
  standalone: true,
  imports: [CommonModule, TabViewModule],
  templateUrl: './tabview.component.html',
  styleUrls: ['./tabview.component.css']
})
export class TabViewComponent {
  @Input() activeIndex: number = 0;
}
