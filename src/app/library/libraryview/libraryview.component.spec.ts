import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryviewComponent } from './libraryview.component';

describe('LibraryviewComponent', () => {
  let component: LibraryviewComponent;
  let fixture: ComponentFixture<LibraryviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
