import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseEntryFormComponent } from './house-entry-form.component';

describe('HouseEntryFormComponent', () => {
  let component: HouseEntryFormComponent;
  let fixture: ComponentFixture<HouseEntryFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseEntryFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseEntryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
