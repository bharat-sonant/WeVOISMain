import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransectionDetailV1Component } from './card-transection-detail-v1.component';

describe('CardTransectionDetailV1Component', () => {
  let component: CardTransectionDetailV1Component;
  let fixture: ComponentFixture<CardTransectionDetailV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardTransectionDetailV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardTransectionDetailV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
