import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransectionDetailComponent } from './card-transection-detail.component';

describe('CardTransectionDetailComponent', () => {
  let component: CardTransectionDetailComponent;
  let fixture: ComponentFixture<CardTransectionDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardTransectionDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardTransectionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
