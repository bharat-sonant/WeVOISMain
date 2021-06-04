import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkipLineComponent } from './skip-line.component';

describe('SkipLineComponent', () => {
  let component: SkipLineComponent;
  let fixture: ComponentFixture<SkipLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkipLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkipLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
