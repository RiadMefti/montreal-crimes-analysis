import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { DataService } from '../../services/data.service';
import { NeighborhoodData } from '../../interfaces/scatterplot';
import { CommonModule } from '@angular/common';
import d3Tip from 'd3-tip'

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
  private width: number = 960 - this.margin.left - this.margin.right;
  private height: number = 500 - this.margin.top - this.margin.bottom;
  variables: any[] = []
  currentVariable: string = 'median_income';

  private tip = (<any>d3Tip)().attr('class', 'd3-tip').html((d: NeighborhoodData) => this.getToolTipContent(d));
  
  nameMap: Map<string, string> = new Map(Object.entries({
    'median_income': 'Median Income',
    'population': 'Population',
    'crime_rate': 'Crime Rate',
    'density': 'Density',
    'singleparent_nb': 'Single Parent Number',
    'singleparent_pct': 'Single Parent Percentage',
    'avg_age': 'Average Age',
    'median_age': 'Median Age',
    'no_diploma_nb': 'No Diploma Number',
    'no_diploma_pct': 'No Diploma Percentage',
    'highschool_diploma_nb': 'High School Diploma Number',
    'highschool_diploma_pct': 'High School Diploma Percentage',
    'unemployment_rate': 'Unemployment Rate',
    'C90_C10_ratio': 'C90 C10 Ratio',
    'Gini_index': 'Gini Index',
    'total_crime': 'Total Crime'
  }));

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.loadGraph();
  }
  
  async loadGraph() {
    await this.getNeighborhoodData();
    this.setupChart();
    this.buildChart();
    this.svg.call(this.tip);
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


  buildChart() {
    const oldXPosition: any[] = []
    this.svg.selectAll('circle')._groups[0].forEach((d: any) => oldXPosition.push(d.cx.baseVal.value));
  
    const oldYPosition: any[] = []
    this.svg.selectAll('circle')._groups[0].forEach((d: any) => oldYPosition.push(d.cy.baseVal.value));
    
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.setupChart();

    const xScale = this.setXScale();
    const yScale = this.setYScale();
    const radiusScale = this.setRadiusScale(this.data);
    console.log(xScale, yScale);
    this.drawAxes(xScale, yScale);

    this.drawCircles(xScale, yScale, radiusScale, oldXPosition, oldYPosition);
    this.moveCircles(xScale, yScale);
    this.setCircleHoverHandler(this.tip);
  }

  drawCircles(
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    radiusScale: d3.ScaleLinear<number, number>,
    oldXPosition: number[] = [],
    oldYPosition: number[] = []
  )

    {
    console.log("Drawing Circles");
    this.svg.selectAll('circle')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', oldXPosition.length > 0 ? (d : NeighborhoodData, i: number) => oldXPosition[i] : (d : NeighborhoodData) => xScale(+d[this.currentVariable as keyof NeighborhoodData]))
      .attr('cy', oldYPosition.length > 0 ? (d : NeighborhoodData, i: number) => oldYPosition[i] : (d : NeighborhoodData) => yScale(d.crime_rate))
      .attr('r', (d : NeighborhoodData) => radiusScale(d.population))
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.5)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('id', (d: NeighborhoodData) => d.name.replaceAll("'", '').replaceAll(' ', '-'));
  }

  moveCircles(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
    this.svg.selectAll('circle')
      .transition()
      .duration(1000)
      .attr('cx', (d : NeighborhoodData) => xScale(+d[this.currentVariable as keyof NeighborhoodData]))
      .attr('cy', (d : NeighborhoodData) => yScale(d.crime_rate));
  }

  setXScale() {
    const values = this.data.map(x => +x[this.currentVariable as keyof NeighborhoodData]);
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
      this.currentVariable = xName;
      this.buildChart();
  }

  setCircleHoverHandler(tip: any) {
    this.svg.selectAll('circle')
      .on('mouseover', (event: MouseEvent, d: NeighborhoodData) => {
        console.log(event.target);
        this.svg.selectAll('circle').transition().duration(200).style('opacity', 0.5);
        const name = d.name.replaceAll("'", '').replaceAll(' ', '-');
        console.log(name);
        this.svg.select(`#${name}`).transition().duration(200).style('opacity', 1);
        tip.show(d, event.target as SVGElement);
      })
      .on('mouseout', (d: NeighborhoodData) => {
        this.svg.selectAll('circle').transition().duration(200).style('opacity', 1);
        tip.hide()
      });
  }

  getToolTipContent(data: NeighborhoodData) {
    const variableName = this.getVariableName(this.currentVariable);
    console.log(variableName);
    return `
      <div>
        <p>Neighborhood: ${data.name}</p>
        <p>Population: ${data.population}</p>
        <p>Crime Rate: ${data.crime_rate}</p>
        <p> ${variableName}: ${+data[this.currentVariable as keyof NeighborhoodData]}</p>
      </div>
    `;
  }

  getVariableName(variable: string) {
    return this.nameMap.get(variable) || variable;
  }
}
