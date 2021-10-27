import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JmapsComponent } from './jmaps.component';

describe('JmapsComponent', () => {
  let component: JmapsComponent;
  let fixture: ComponentFixture<JmapsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JmapsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JmapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
