import { TestBed } from '@angular/core/testing';

import { DustbinService } from './dustbin.service';

describe('DustbinService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DustbinService = TestBed.get(DustbinService);
    expect(service).toBeTruthy();
  });
});
