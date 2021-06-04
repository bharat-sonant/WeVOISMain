import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceInventoryEntryComponent } from './maintenance-inventory-entry.component';

describe('MaintenanceInventoryEntryComponent', () => {
  let component: MaintenanceInventoryEntryComponent;
  let fixture: ComponentFixture<MaintenanceInventoryEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaintenanceInventoryEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceInventoryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
