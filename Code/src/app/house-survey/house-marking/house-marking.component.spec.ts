import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseMarkingComponent } from './house-marking.component';

describe('HouseMarkingComponent', () => {
  let component: HouseMarkingComponent;
  let fixture: ComponentFixture<HouseMarkingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseMarkingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseMarkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
