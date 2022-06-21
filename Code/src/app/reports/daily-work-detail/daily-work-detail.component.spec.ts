import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyWorkDetailComponent } from './daily-work-detail.component';

describe('DailyWorkDetailComponent', () => {
  let component: DailyWorkDetailComponent;
  let fixture: ComponentFixture<DailyWorkDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyWorkDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyWorkDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
