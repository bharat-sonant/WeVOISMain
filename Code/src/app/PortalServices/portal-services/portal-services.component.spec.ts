import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalServicesComponent } from './portal-services.component';

describe('PortalServicesComponent', () => {
  let component: PortalServicesComponent;
  let fixture: ComponentFixture<PortalServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortalServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortalServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
