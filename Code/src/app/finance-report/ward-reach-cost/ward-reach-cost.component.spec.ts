import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardReachCostComponent } from './ward-reach-cost.component';

describe('WardReachCostComponent', () => {
  let component: WardReachCostComponent;
  let fixture: ComponentFixture<WardReachCostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardReachCostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardReachCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
