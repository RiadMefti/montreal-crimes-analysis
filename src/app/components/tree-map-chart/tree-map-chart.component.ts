import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-tree-map-chart',
  standalone: true,
  imports: [],
  templateUrl: './tree-map-chart.component.html',
  styleUrl: './tree-map-chart.component.scss'
})
export class TreeMapChartComponent {
  constructor(private dataService: DataService) {}

  ngAfterViewInit() {
    this.createChart();
  }

  private async createChart() {
      // Your D3 chart code goes here
      const data = await this.dataService.getTreeMapData();
      console.info('data', data)
  }
}
