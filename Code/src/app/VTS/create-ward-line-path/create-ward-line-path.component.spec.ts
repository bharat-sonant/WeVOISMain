import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWardLinePathComponent } from './create-ward-line-path.component';

describe('CreateWardLinePathComponent', () => {
  let component: CreateWardLinePathComponent;
  let fixture: ComponentFixture<CreateWardLinePathComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWardLinePathComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWardLinePathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
