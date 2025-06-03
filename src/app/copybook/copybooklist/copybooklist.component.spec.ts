import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopybooklistComponent } from './copybooklist.component';

describe('CopybooklistComponent', () => {
  let component: CopybooklistComponent;
  let fixture: ComponentFixture<CopybooklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopybooklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopybooklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
