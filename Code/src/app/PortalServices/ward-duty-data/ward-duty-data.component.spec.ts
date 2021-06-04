import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardDutyDataComponent } from './ward-duty-data.component';

describe('WardDutyDataComponent', () => {
  let component: WardDutyDataComponent;
  let fixture: ComponentFixture<WardDutyDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardDutyDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardDutyDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
