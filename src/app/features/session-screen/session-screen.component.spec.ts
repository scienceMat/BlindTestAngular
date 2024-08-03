import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionScreenComponent } from './session-screen.component';

describe('SessionScreenComponent', () => {
  let component: SessionScreenComponent;
  let fixture: ComponentFixture<SessionScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
