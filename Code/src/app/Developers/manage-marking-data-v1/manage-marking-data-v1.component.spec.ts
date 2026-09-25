import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageMarkingDataV1Component } from './manage-marking-data-v1.component';

describe('ManageMarkingDataV1Component', () => {
  let component: ManageMarkingDataV1Component;
  let fixture: ComponentFixture<ManageMarkingDataV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageMarkingDataV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageMarkingDataV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
