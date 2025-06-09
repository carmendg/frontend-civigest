import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatlistComponent } from './seatlist.component';

describe('SeatlistComponent', () => {
  let component: SeatlistComponent;
  let fixture: ComponentFixture<SeatlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
