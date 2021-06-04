import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PetrolInventoryListComponent } from './petrol-inventory-list.component';

describe('PetrolInventoryListComponent', () => {
  let component: PetrolInventoryListComponent;
  let fixture: ComponentFixture<PetrolInventoryListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PetrolInventoryListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PetrolInventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
