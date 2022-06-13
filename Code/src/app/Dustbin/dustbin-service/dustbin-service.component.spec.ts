import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinServiceComponent } from './dustbin-service.component';

describe('DustbinServiceComponent', () => {
  let component: DustbinServiceComponent;
  let fixture: ComponentFixture<DustbinServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
