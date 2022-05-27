import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinManageComponent } from './dustbin-manage.component';

describe('DustbinManageComponent', () => {
  let component: DustbinManageComponent;
  let fixture: ComponentFixture<DustbinManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
