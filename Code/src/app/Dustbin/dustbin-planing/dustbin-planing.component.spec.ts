import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinPlaningComponent } from './dustbin-planing.component';

describe('DustbinPlaningComponent', () => {
  let component: DustbinPlaningComponent;
  let fixture: ComponentFixture<DustbinPlaningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinPlaningComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinPlaningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
