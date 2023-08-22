import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetMarkerImagesComponent } from './set-marker-images.component';

describe('SetMarkerImagesComponent', () => {
  let component: SetMarkerImagesComponent;
  let fixture: ComponentFixture<SetMarkerImagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetMarkerImagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetMarkerImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
