import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityModificationComponent } from './entity-modification.component';

describe('EntityModificationComponent', () => {
  let component: EntityModificationComponent;
  let fixture: ComponentFixture<EntityModificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntityModificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityModificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
