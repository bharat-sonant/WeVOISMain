import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardRoadDetailComponent } from './ward-road-detail.component';

describe('WardRoadDetailComponent', () => {
  let component: WardRoadDetailComponent;
  let fixture: ComponentFixture<WardRoadDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardRoadDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardRoadDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
