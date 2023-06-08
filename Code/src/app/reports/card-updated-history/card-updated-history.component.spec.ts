import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardUpdatedHistoryComponent } from './card-updated-history.component';

describe('CardUpdatedHistoryComponent', () => {
  let component: CardUpdatedHistoryComponent;
  let fixture: ComponentFixture<CardUpdatedHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardUpdatedHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardUpdatedHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
