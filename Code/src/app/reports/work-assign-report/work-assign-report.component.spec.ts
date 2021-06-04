import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkAssignReportComponent } from './work-assign-report.component';

describe('WorkAssignReportComponent', () => {
  let component: WorkAssignReportComponent;
  let fixture: ComponentFixture<WorkAssignReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkAssignReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkAssignReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
