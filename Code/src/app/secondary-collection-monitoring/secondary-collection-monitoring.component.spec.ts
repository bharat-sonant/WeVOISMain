import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionMonitoringComponent } from './secondary-collection-monitoring.component';

describe('SecondaryCollectionMonitoringComponent', () => {
  let component: SecondaryCollectionMonitoringComponent;
  let fixture: ComponentFixture<SecondaryCollectionMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
