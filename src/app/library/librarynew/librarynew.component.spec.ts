import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrarynewComponent } from './librarynew.component';

describe('LibrarynewComponent', () => {
  let component: LibrarynewComponent;
  let fixture: ComponentFixture<LibrarynewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrarynewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibrarynewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
