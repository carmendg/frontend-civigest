import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopybooknewComponent } from './copybooknew.component';

describe('CopybooknewComponent', () => {
  let component: CopybooknewComponent;
  let fixture: ComponentFixture<CopybooknewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopybooknewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopybooknewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
