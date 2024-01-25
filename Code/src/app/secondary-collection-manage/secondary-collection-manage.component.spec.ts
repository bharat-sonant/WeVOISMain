import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionManageComponent } from './secondary-collection-manage.component';

describe('SecondaryCollectionManageComponent', () => {
  let component: SecondaryCollectionManageComponent;
  let fixture: ComponentFixture<SecondaryCollectionManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
