import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetrolInventoryEntryComponent } from './petrol-inventory-entry.component';

describe('PetrolInventoryEntryComponent', () => {
  let component: PetrolInventoryEntryComponent;
  let fixture: ComponentFixture<PetrolInventoryEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetrolInventoryEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetrolInventoryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
