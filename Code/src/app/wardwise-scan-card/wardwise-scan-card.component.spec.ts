import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardwiseScanCardComponent } from './wardwise-scan-card.component';

describe('WardwiseScanCardComponent', () => {
  let component: WardwiseScanCardComponent;
  let fixture: ComponentFixture<WardwiseScanCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardwiseScanCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardwiseScanCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
