import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservenewComponent } from './reservenew.component';

describe('ReservenewComponent', () => {
  let component: ReservenewComponent;
  let fixture: ComponentFixture<ReservenewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservenewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservenewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
