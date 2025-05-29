import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardDutyOnComponent } from './ward-duty-on.component';

describe('WardDutyOnComponent', () => {
  let component: WardDutyOnComponent;
  let fixture: ComponentFixture<WardDutyOnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardDutyOnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardDutyOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
