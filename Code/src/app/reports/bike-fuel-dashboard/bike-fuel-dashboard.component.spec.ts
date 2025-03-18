import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeFuelDashboardComponent } from './bike-fuel-dashboard.component';

describe('BikeFuelDashboardComponent', () => {
  let component: BikeFuelDashboardComponent;
  let fixture: ComponentFixture<BikeFuelDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeFuelDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeFuelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
