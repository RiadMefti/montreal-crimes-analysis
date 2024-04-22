import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChoroplethChartComponent } from "./components/choropleth-chart/choropleth-chart.component";
import { StackedAreaChartComponent } from "./components/stacked-area-chart/stacked-area-chart.component";
import { RadialBarChartComponent } from "./components/radial-bar-chart/radial-bar-chart.component";
import { TreeMapChartComponent } from "./components/tree-map-chart/tree-map-chart.component";
import { ScatterPlotChartComponent } from "./components/scatter-plot-chart/scatter-plot-chart.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [RouterOutlet, ChoroplethChartComponent, StackedAreaChartComponent, RadialBarChartComponent, TreeMapChartComponent, ScatterPlotChartComponent]
})
export class AppComponent {
  title = 'montreal-crimes-analysis';

  public scroll($element: any): void{
    $element.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
  }
}
