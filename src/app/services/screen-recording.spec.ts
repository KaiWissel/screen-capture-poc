import { TestBed } from '@angular/core/testing';

import { ScreenRecordingService } from './screen-recording';

describe('ScreenRecordingService', () => {
  let service: ScreenRecordingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScreenRecordingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
