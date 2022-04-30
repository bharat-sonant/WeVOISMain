import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinWardMappingComponent } from './dustbin-ward-mapping.component';

describe('DustbinWardMappingComponent', () => {
  let component: DustbinWardMappingComponent;
  let fixture: ComponentFixture<DustbinWardMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinWardMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinWardMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
