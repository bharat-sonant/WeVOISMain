import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UccChargeCollectionDashboardComponent } from './ucc-charge-collection-dashboard.component';

describe('UccChargeCollectionDashboardComponent', () => {
  let component: UccChargeCollectionDashboardComponent;
  let fixture: ComponentFixture<UccChargeCollectionDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UccChargeCollectionDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UccChargeCollectionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
