import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseUtilizationComponent } from './database-utilization.component';

describe('DatabaseUtilizationComponent', () => {
  let component: DatabaseUtilizationComponent;
  let fixture: ComponentFixture<DatabaseUtilizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseUtilizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseUtilizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
