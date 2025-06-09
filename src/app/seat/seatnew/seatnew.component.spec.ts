import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatnewComponent } from './seatnew.component';

describe('SeatnewComponent', () => {
  let component: SeatnewComponent;
  let fixture: ComponentFixture<SeatnewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatnewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatnewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
