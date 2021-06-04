import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseCardMappingComponent } from './house-card-mapping.component';

describe('HouseCardMappingComponent', () => {
  let component: HouseCardMappingComponent;
  let fixture: ComponentFixture<HouseCardMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseCardMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseCardMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
