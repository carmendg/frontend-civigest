import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderviewComponent } from './providerview.component';

describe('ProviderviewComponent', () => {
  let component: ProviderviewComponent;
  let fixture: ComponentFixture<ProviderviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
