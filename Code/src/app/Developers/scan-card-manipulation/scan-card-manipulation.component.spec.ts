import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanCardManipulationComponent } from './scan-card-manipulation.component';

describe('ScanCardManipulationComponent', () => {
  let component: ScanCardManipulationComponent;
  let fixture: ComponentFixture<ScanCardManipulationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanCardManipulationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanCardManipulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
