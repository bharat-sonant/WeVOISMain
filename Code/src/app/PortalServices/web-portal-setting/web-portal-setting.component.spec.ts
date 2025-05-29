import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebPortalSettingComponent } from './web-portal-setting.component';

describe('WebPortalSettingComponent', () => {
  let component: WebPortalSettingComponent;
  let fixture: ComponentFixture<WebPortalSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebPortalSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebPortalSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
