import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SacnCardStatusComponent } from './sacn-card-status.component';

describe('SacnCardStatusComponent', () => {
  let component: SacnCardStatusComponent;
  let fixture: ComponentFixture<SacnCardStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SacnCardStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SacnCardStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
