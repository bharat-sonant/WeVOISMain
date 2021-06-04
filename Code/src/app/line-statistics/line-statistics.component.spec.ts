import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineStatisticsComponent } from './line-statistics.component';

describe('LineStatisticsComponent', () => {
  let component: LineStatisticsComponent;
  let fixture: ComponentFixture<LineStatisticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
