import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveviewComponent } from './archiveview.component';

describe('ArchiveviewComponent', () => {
  let component: ArchiveviewComponent;
  let fixture: ComponentFixture<ArchiveviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchiveviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
