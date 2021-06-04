import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineCardMappingComponent } from './line-card-mapping.component';

describe('LineCardMappingComponent', () => {
  let component: LineCardMappingComponent;
  let fixture: ComponentFixture<LineCardMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineCardMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineCardMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
