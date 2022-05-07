import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineWeightageComponent } from './line-weightage.component';

describe('LineWeightageComponent', () => {
  let component: LineWeightageComponent;
  let fixture: ComponentFixture<LineWeightageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineWeightageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineWeightageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
