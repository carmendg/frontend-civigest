import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookviewComponent } from './bookview.component';

describe('BookviewComponent', () => {
  let component: BookviewComponent;
  let fixture: ComponentFixture<BookviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
