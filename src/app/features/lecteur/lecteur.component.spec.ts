import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecteurComponent } from './lecteur.component';

describe('LecteurComponent', () => {
  let component: LecteurComponent;
  let fixture: ComponentFixture<LecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
