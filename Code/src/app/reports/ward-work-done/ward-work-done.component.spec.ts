import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardWorkDoneComponent } from './ward-work-done.component';

describe('WardWorkDoneComponent', () => {
  let component: WardWorkDoneComponent;
  let fixture: ComponentFixture<WardWorkDoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardWorkDoneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardWorkDoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
