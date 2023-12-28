import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageLoadHistoryComponent } from './page-load-history.component';

describe('PageLoadHistoryComponent', () => {
  let component: PageLoadHistoryComponent;
  let fixture: ComponentFixture<PageLoadHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageLoadHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageLoadHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
