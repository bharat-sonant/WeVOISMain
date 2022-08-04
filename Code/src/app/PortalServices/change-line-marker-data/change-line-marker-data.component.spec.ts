import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLineMarkerDataComponent } from './change-line-marker-data.component';

describe('ChangeLineMarkerDataComponent', () => {
  let component: ChangeLineMarkerDataComponent;
  let fixture: ComponentFixture<ChangeLineMarkerDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeLineMarkerDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeLineMarkerDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
