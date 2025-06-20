import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivenewComponent } from './archivenew.component';

describe('ArchivenewComponent', () => {
  let component: ArchivenewComponent;
  let fixture: ComponentFixture<ArchivenewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivenewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivenewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
