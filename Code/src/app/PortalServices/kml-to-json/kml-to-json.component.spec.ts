import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KmlToJsonComponent } from './kml-to-json.component';

describe('KmlToJsonComponent', () => {
  let component: KmlToJsonComponent;
  let fixture: ComponentFixture<KmlToJsonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KmlToJsonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KmlToJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
