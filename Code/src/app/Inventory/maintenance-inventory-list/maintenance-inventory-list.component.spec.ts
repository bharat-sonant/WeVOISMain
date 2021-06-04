import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceInventoryListComponent } from './maintenance-inventory-list.component';

describe('MaintenanceInventoryListComponent', () => {
  let component: MaintenanceInventoryListComponent;
  let fixture: ComponentFixture<MaintenanceInventoryListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaintenanceInventoryListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceInventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
