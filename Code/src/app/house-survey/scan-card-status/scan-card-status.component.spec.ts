import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanCardStatusComponent } from './scan-card-status.component';

describe('ScanCardStatusComponent', () => {
  let component: ScanCardStatusComponent;
  let fixture: ComponentFixture<ScanCardStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanCardStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanCardStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
