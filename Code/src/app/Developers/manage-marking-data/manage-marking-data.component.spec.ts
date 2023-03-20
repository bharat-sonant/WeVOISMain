import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageMarkingDataComponent } from './manage-marking-data.component';

describe('ManageMarkingDataComponent', () => {
  let component: ManageMarkingDataComponent;
  let fixture: ComponentFixture<ManageMarkingDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageMarkingDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageMarkingDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
