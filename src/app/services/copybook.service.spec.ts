import { TestBed } from '@angular/core/testing';

import { CopybookService } from './copybook.service';

describe('CopybookService', () => {
  let service: CopybookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopybookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
