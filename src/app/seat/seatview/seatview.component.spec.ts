import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatviewComponent } from './seatview.component';

describe('SeatviewComponent', () => {
  let component: SeatviewComponent;
  let fixture: ComponentFixture<SeatviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
