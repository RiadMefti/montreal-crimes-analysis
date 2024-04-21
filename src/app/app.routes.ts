import { HomePageComponent } from './pages/home-page/home-page.component';
import { RadialBarChartComponent } from './components/radial-bar-chart/radial-bar-chart.component';
import { StackedAreaChartComponent } from './components/stacked-area-chart/stacked-area-chart.component';
import { ChoroplethChartComponent } from './components/choropleth-chart/choropleth-chart.component';
import { TreeMapChartComponent } from './components/tree-map-chart/tree-map-chart.component';
import { ScatterPlotChartComponent } from './components/scatter-plot-chart/scatter-plot-chart.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'home', component: HomePageComponent },
    { path: 'radial-bar-chart', component: RadialBarChartComponent },
    { path: 'stacked-area-chart', component: StackedAreaChartComponent },
    { path: 'choropleth-chart', component: ChoroplethChartComponent },
    { path: 'tree-map-chart', component: TreeMapChartComponent },
    { path: 'scatter-plot-chart', component: ScatterPlotChartComponent }
];