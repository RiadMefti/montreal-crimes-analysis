import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as d3 from 'd3';
export interface RadialChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-radial-bar-chart',
  standalone: true,
  imports: [],
  templateUrl: './radial-bar-chart.component.html',
  styleUrl: './radial-bar-chart.component.scss'
})

export class RadialBarChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') chartContainer!: ElementRef;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {

    this.createChart();
  }
  private async createChart(): Promise<void> {
    // Make sure we have a chart container to work with

    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    const data: RadialChartData[] = await this.dataService.prepareDataForRadialBarChart();
    const width = 600, height = 600;
    const innerRadius = 100;
    const outerRadius = Math.min(width, height) / 2;

    const svg = d3.select(element).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);



    // Tooltip setup
    const tooltip = d3.select(element).append('div')
      .style('position', 'absolute')
      .style('background', 'lightgrey')
      .style('padding', '8px')
      .style('display', 'none')
      .style('pointer-events', 'none') // To avoid the tooltip itself interfering with mouse events
      .style('font-size', '12px');

    // Instead of using the value for the pie layout, we'll make sure each slice is 1/3 of the circle
    const pie = d3.pie<RadialChartData>()
      .sort(null) // Do not sort, we want to control the order of slices
      .value(d => 1) // Each segment has an equal value for equal space distribution
      .startAngle(0) // Optional: you can set a start angle if you want to rotate the chart
      .endAngle(2 * Math.PI); // Full circle

    // Since all segments are equal, the outer radius calculation needs to reflect the actual data values.
    // This would be a linear scale from the minimum data value to the maximum data value.
    const maxDataValue = d3.max(data, d => d.value) ?? 0; // Fallback to 0 if data is empty

    const valueScale = d3.scaleLinear()
      .domain([0, maxDataValue])
      .range([innerRadius, outerRadius]);

    // Now, when setting the outerRadius for each arc, you use the valueScale to determine its radius
    const arc = d3.arc<d3.PieArcDatum<RadialChartData>>()
      .innerRadius(innerRadius)
      .outerRadius(d => valueScale(d.data.value)); // Using the valueScale to set the outerRadius


    svg.selectAll('path')
      .data(pie(data) as d3.PieArcDatum<RadialChartData>[]) // Type assertion here
      .enter().append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => {
        const colors = ['#98c1d9', '#ee6c4d', '#293241'];
        return colors[i % colors.length];
      })
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html(`${d.data.value} crimes`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });

    svg.selectAll('text')
      .data(pie(data) as d3.PieArcDatum<RadialChartData>[]) // And here
      .enter().append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '1em')
      .style('fill', 'white')
      .style('font-size', '18px')
     
      .text(d => d.data.name);

    // Add dashed lines, using a loop to create multiple lines if necessary
    const levels = 3; // For example, 3 dashed lines
    const levelStep = (outerRadius - innerRadius) / levels;

    for (let i = 0; i < levels; i++) {
      svg.append('circle')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('r', innerRadius + levelStep * (i + 1))
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '5,5');
    }
  }
}