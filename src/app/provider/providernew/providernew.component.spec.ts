import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvidernewComponent } from './providernew.component';

describe('ProvidernewComponent', () => {
  let component: ProvidernewComponent;
  let fixture: ComponentFixture<ProvidernewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProvidernewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProvidernewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
