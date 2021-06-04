import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleMapsComponent } from './multiple-maps.component';

describe('MultipleMapsComponent', () => {
  let component: MultipleMapsComponent;
  let fixture: ComponentFixture<MultipleMapsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleMapsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
