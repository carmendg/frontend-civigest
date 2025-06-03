import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopybookviewComponent } from './copybookview.component';

describe('CopybookviewComponent', () => {
  let component: CopybookviewComponent;
  let fixture: ComponentFixture<CopybookviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopybookviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopybookviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
