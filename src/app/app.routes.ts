import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';

export const routes: Routes = [
    { path: '', title: 'Home Page', component: HomePageComponent},
    { path: 'home', title: 'Home Page', component: HomePageComponent}
];
