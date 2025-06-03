import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorSelectorDialogComponent } from './author-selector-dialog.component';

describe('AuthorSelectorDialogComponent', () => {
  let component: AuthorSelectorDialogComponent;
  let fixture: ComponentFixture<AuthorSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorSelectorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
