import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraVtsDashboardComponent } from './camera-vts-dashboard.component';

describe('CameraVtsDashboardComponent', () => {
  let component: CameraVtsDashboardComponent;
  let fixture: ComponentFixture<CameraVtsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CameraVtsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraVtsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
