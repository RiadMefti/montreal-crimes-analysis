import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService } from '../../services/data.service';
import { NeighborhoodData } from '../../interfaces/scatterplot';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-scatter-plot-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scatter-plot-chart.component.html',
  styleUrl: './scatter-plot-chart.component.scss'
})
export class ScatterPlotChartComponent implements OnInit {

  @ViewChild('chart') chartContainer!: ElementRef;
  data: Array<NeighborhoodData> = [];
  private margin = { top: 20, right: 30, bottom: 40, left: 50 };
  private svg: any;
  private tooltip: any;
  private width: number = 960 - this.margin.left - this.margin.right;
  private height: number = 500 - this.margin.top - this.margin.bottom;
  variables: any[] = []

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.loadGraph();
  }
  
  async loadGraph() {
    await this.getNeighborhoodData();
    this.setupChart();
    this.buildChart();
  }

  async getNeighborhoodData() {
    this.data = await this.dataService.getNeighborhoodData();
    this.variables = Object.keys(this.data[0]);
  }

  setupChart() {
    const element = this.chartContainer.nativeElement;

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }


  buildChart(xName = 'median_income') {
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.setupChart();

    const xScale = this.setXScale(xName);
    const yScale = this.setYScale();
    const radiusScale = this.setRadiusScale(this.data);
    console.log(xScale, yScale);
    this.drawAxes(xScale, yScale);

    this.drawCircles(xScale, yScale, radiusScale, xName);
  }

  drawCircles(
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    radiusScale: d3.ScaleLinear<number, number>,
    xName:string='median_income')
    {
    console.log("Drawing Circles");
    this.svg.selectAll('circle')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', (d : NeighborhoodData) => xScale(+d[xName as keyof NeighborhoodData]))
      .attr('cy', (d : NeighborhoodData) => yScale(d.crime_rate))
      .attr('r', (d : NeighborhoodData) => radiusScale(d.population))
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.5)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }

  setXScale(xName:string='median_income') {
    const values = this.data.map(x => +x[xName as keyof NeighborhoodData]);
    console.log(d3.extent(values) as [number, number]);
    return d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([0, this.width]);
  }

  setYScale() {
    const values = this.data.map(x => +x.crime_rate);
    return d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([this.height, 0]);
  }

  setRadiusScale(data: Array<NeighborhoodData>) {
    const values = data.map(x => +x.population);
    return d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([5, 20]);
  }

  private drawAxes(x: d3.ScaleLinear<number, number>, y: d3.ScaleLinear<number, number>) {
    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(x));

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y));
  }

  onVariableChange($event: Event) {
      const xName = ($event.target as HTMLSelectElement).value;
      this.buildChart(xName);
  }

}
