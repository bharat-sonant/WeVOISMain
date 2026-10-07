import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineCardMappingV1Component } from './line-card-mapping-v1.component';

describe('LineCardMappingV1Component', () => {
  let component: LineCardMappingV1Component;
  let fixture: ComponentFixture<LineCardMappingV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineCardMappingV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineCardMappingV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
