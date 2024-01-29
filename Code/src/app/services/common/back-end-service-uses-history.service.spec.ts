import { TestBed } from '@angular/core/testing';

import { BackEndServiceUsesHistoryService } from './back-end-service-uses-history.service';

describe('BackEndServiceUsesHistoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackEndServiceUsesHistoryService = TestBed.get(BackEndServiceUsesHistoryService);
    expect(service).toBeTruthy();
  });
});
