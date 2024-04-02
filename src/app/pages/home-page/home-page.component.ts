import { Component } from '@angular/core';
import { TreeMapChartComponent } from '../../components/tree-map-chart/tree-map-chart.component';
import { ChoroplethChartComponent } from '../../components/choropleth-chart/choropleth-chart.component';
import { StackedAreaChartComponent } from '../../components/stacked-area-chart/stacked-area-chart.component';
import { RadialBarChartComponent } from '../../components/radial-bar-chart/radial-bar-chart.component';
import { ScatterPlotChartComponent } from '../../components/scatter-plot-chart/scatter-plot-chart.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    ChoroplethChartComponent,
    StackedAreaChartComponent,
    RadialBarChartComponent,
    ScatterPlotChartComponent,
    TreeMapChartComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

}
