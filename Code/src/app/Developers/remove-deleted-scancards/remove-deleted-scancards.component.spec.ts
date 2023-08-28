import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveDeletedScancardsComponent } from './remove-deleted-scancards.component';

describe('RemoveDeletedScancardsComponent', () => {
  let component: RemoveDeletedScancardsComponent;
  let fixture: ComponentFixture<RemoveDeletedScancardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveDeletedScancardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveDeletedScancardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
