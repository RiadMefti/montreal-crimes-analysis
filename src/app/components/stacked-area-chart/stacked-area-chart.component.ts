import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as d3 from 'd3';
@Component({
  selector: 'app-stacked-area-chart',
  standalone: true,
  imports: [],
  templateUrl: './stacked-area-chart.component.html',
  styleUrl: './stacked-area-chart.component.scss'
})
export class StackedAreaChartComponent {
  montrealCrimeData: any;
  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getMontrealCrimeData();
  }

  private async getMontrealCrimeData() {
    try {
      const data = await this.dataService.getMontrealCrimeData();
      this.montrealCrimeData = this.dataService.prepareDataStackedAreaChart(data);
      console.log('Prepared data Stacked Chart:', this.montrealCrimeData);
      this.drawChart();
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  }

  drawChart() {

  }
}
