import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSurveyorVirtualComponent } from './update-surveyor-virtual.component';

describe('UpdateSurveyorVirtualComponent', () => {
  let component: UpdateSurveyorVirtualComponent;
  let fixture: ComponentFixture<UpdateSurveyorVirtualComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateSurveyorVirtualComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateSurveyorVirtualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
