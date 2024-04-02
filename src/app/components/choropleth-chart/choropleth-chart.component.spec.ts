import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoroplethChartComponent } from './choropleth-chart.component';

describe('ChoroplethChartComponent', () => {
  let component: ChoroplethChartComponent;
  let fixture: ComponentFixture<ChoroplethChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoroplethChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChoroplethChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
