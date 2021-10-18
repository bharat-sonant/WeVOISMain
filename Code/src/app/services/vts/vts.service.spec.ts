import { TestBed } from '@angular/core/testing';

import { VtsService } from './vts.service';

describe('VtsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VtsService = TestBed.get(VtsService);
    expect(service).toBeTruthy();
  });
});
