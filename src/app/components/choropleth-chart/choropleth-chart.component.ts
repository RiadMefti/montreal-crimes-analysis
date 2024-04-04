import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-choropleth-chart',
  standalone: true,
  imports: [],
  templateUrl: './choropleth-chart.component.html',
  styleUrl: './choropleth-chart.component.scss'
})
export class ChoroplethChartComponent {
  montrealCrimeData: any;
  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getMontrealCrimeData();
  }
  async getMontrealCrimeData() {
    this.montrealCrimeData = await this.dataService.getMontrealCrimeData();
    console.log(this.montrealCrimeData);
  }
}
