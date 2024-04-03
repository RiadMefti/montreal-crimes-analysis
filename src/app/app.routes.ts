import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { RadialBarChartComponent } from './components/radial-bar-chart/radial-bar-chart.component';

export const routes: Routes = [
    { path: '', title: 'Home Page', component: HomePageComponent},
    { path: 'home', title: 'Home Page', component: HomePageComponent},
    { path : 'radial', title: 'Radial', component: RadialBarChartComponent},
];
