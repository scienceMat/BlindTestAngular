import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayPlaylistComponent } from './display-playlist.component';

describe('DisplayPlaylistComponent', () => {
  let component: DisplayPlaylistComponent;
  let fixture: ComponentFixture<DisplayPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayPlaylistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
