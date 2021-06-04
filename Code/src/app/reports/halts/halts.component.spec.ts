import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HaltsComponent } from './halts.component';

describe('HaltsComponent', () => {
  let component: HaltsComponent;
  let fixture: ComponentFixture<HaltsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HaltsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HaltsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
