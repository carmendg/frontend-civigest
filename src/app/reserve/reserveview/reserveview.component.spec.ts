import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserveviewComponent } from './reserveview.component';

describe('ReserveviewComponent', () => {
  let component: ReserveviewComponent;
  let fixture: ComponentFixture<ReserveviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReserveviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReserveviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
