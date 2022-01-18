import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PenaltyPortalServiceComponent } from './penalty-portal-service.component';

describe('PenaltyPortalServiceComponent', () => {
  let component: PenaltyPortalServiceComponent;
  let fixture: ComponentFixture<PenaltyPortalServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PenaltyPortalServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PenaltyPortalServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
