import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsDashboardComponent } from './assets-dashboard.component';

describe('AssetsDashboardComponent', () => {
  let component: AssetsDashboardComponent;
  let fixture: ComponentFixture<AssetsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
