import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JmapsTestPurposeComponent } from './jmaps-test-purpose.component';

describe('JmapsTestPurposeComponent', () => {
  let component: JmapsTestPurposeComponent;
  let fixture: ComponentFixture<JmapsTestPurposeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JmapsTestPurposeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JmapsTestPurposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
