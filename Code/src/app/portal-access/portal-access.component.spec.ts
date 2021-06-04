import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalAccessComponent } from './portal-access.component';

describe('PortalAccessComponent', () => {
  let component: PortalAccessComponent;
  let fixture: ComponentFixture<PortalAccessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortalAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortalAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
