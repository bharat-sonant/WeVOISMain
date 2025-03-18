import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SopDashboardComponent } from './sop-dashboard.component';

describe('SopDashboardComponent', () => {
  let component: SopDashboardComponent;
  let fixture: ComponentFixture<SopDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SopDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SopDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
