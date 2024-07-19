import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSpotifyComponent } from './login-spotify.component';

describe('LoginSpotifyComponent', () => {
  let component: LoginSpotifyComponent;
  let fixture: ComponentFixture<LoginSpotifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSpotifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginSpotifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
