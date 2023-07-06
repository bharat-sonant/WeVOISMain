import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VheicleCurrentInfoComponent } from './vheicle-current-info.component';

describe('VheicleCurrentInfoComponent', () => {
  let component: VheicleCurrentInfoComponent;
  let fixture: ComponentFixture<VheicleCurrentInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VheicleCurrentInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VheicleCurrentInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
