import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';

type DataPoint = {
  month: string;
  [category: string]: number | string | undefined;
};

@Component({
  selector: 'app-stacked-area-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stacked-area-chart.component.html',
  styleUrls: ['./stacked-area-chart.component.scss']
})

export class StackedAreaChartComponent implements OnInit {
  @ViewChild('chart') chartContainer!: ElementRef;

  private margin = { top: 20, right: 30, bottom: 40, left: 50 };
  private svg: any;
  private tooltip: any;
  private width: number = 960 - this.margin.left - this.margin.right;
  private height: number = 500 - this.margin.top - this.margin.bottom;
  neighborhoods: any[] = [];
  private allData: any;
  private filteredData: any;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadGraph();
  }

  private async loadGraph() {
    await this.getMontrealCrimeData();
    this.setupChart();
    this.drawChart(this.filteredData);
  }

  private async getMontrealCrimeData() {
    const data = await this.dataService.getMontrealCrimeData();
    this.allData = data;
    this.filteredData = this.dataService.prepareDataStackedAreaChart(data);
    this.populateNeighborhoods();
  }

  private setupChart() {
    const element = this.chartContainer.nativeElement;
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.tooltip = this.svg.append("g")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("pointer-events", "none");

    this.tooltip.append("rect")
      .attr("class", "tooltip-rect")
      .style("fill", "white")
      .style("stroke", "black");

    this.tooltip.append("text")
      .attr("class", "tooltip-text")
      .style("text-anchor", "start")
      .style("font-size", "12px");
  }

  private populateNeighborhoods() {
    this.neighborhoods = [...new Set(this.allData
      .map((item: { ARRONDISSEMENT: any; }) => item.ARRONDISSEMENT)
      .filter((arrondissement: null) => arrondissement != null)
    )]
    .sort((a: any, b: any) => a.localeCompare(b));
  }

  onNeighborhoodChange(event: Event) {
    const selectedNeighborhood = (event.target as HTMLSelectElement).value;
    this.filterData(selectedNeighborhood);
  }

  private filterData(neighborhood: string) {
    if (neighborhood === 'all') {
      this.filteredData = this.dataService.prepareDataStackedAreaChart(this.allData);
    } else {
      const data = this.allData.filter((item: { ARRONDISSEMENT: string; }) => item.ARRONDISSEMENT === neighborhood);
      this.filteredData = this.dataService.prepareDataStackedAreaChart(data);
    }
    this.drawChart(this.filteredData);
  }

  private drawChart(data: any) {
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.setupChart();
    const categories = this.getCategories(data);
    const dates = this.getDates(data);
    const x = this.createXScale(dates);
    const y = this.createYScale(data, categories);
    this.drawAxes(x, y);
    this.drawStackedAreas(data, categories, x, y);
    this.drawLegend(categories);
    this.annotateSpecialDates(x);
  }

  private getCategories(data: any[]): string[] {
    return Object.keys(data[0]).filter(k => k !== 'month');
  }

  private getDates(data: any[]): Date[] {
    return data.map((d: any) => this.parseYearMonthToDate(d.month));
  }

  private createXScale(dates: Date[]) {
    return d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, this.width]);
  }

  private createYScale(data: any[], categories: string[]) {
    let yMax = d3.max(data, (d: DataPoint) => 
      d3.max(categories, cat => {
        let value = 0;
        categories.forEach(categorie => {
          const elementValue = d[categorie];
          value += typeof elementValue === 'number' ? elementValue : (typeof elementValue === 'string' ? parseFloat(elementValue) || 0 : 0);
        });
        return value;
      })
    );
    return d3.scaleLinear()
      .domain([0, yMax ? yMax + 0.3*yMax : 0])
      .range([this.height, 0]);
  }

  private drawAxes(x: d3.ScaleTime<number, number>, y: d3.ScaleLinear<number, number>) {
    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(x));

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y));
  }

  private drawStackedAreas(data: any[], categories: string[], x: d3.ScaleTime<number, number>, y: d3.ScaleLinear<number, number>) {
    const color = this.createColorScale(categories);
    const stackedData = d3.stack().keys(categories)(data);
    const areaGenerator = d3.area<any>()
      .x(d => x(this.parseYearMonthToDate(d.data.month)))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    this.svg.selectAll('.layer')
      .data(stackedData)
      .enter().append('path')
      .attr('class', 'layer')
      .attr('d', areaGenerator)
      .style('fill', (d: { key: string; }) => color(d.key))
      .on("mousemove", (event: any, d: any) => this.handleMouseMove(event, d, data, x, y))
      .on('mouseout', () => this.handleMouseOut());
  }

  private handleMouseMove(event: any, d: any, data: any[], xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>) {
    const [currentXPosition, currentYPosition] = d3.pointer(event, this.svg.node());
    const xValue = xScale.invert(currentXPosition);
    const bisectDate = d3.bisector((d: any) => d.month).left;

    const monthData = this.transformDate(xValue);
    const dataIndex = bisectDate(data, monthData, 1);
    const rightData = data[dataIndex];
    if (rightData && dataIndex > 0) {
      this.updateTooltip(rightData, currentXPosition, currentYPosition)
    }
  }

  private updateTooltip(data: any, currentXPosition: any, currentYPosition: any) {
    this.tooltip.select(".tooltip-text").selectAll("tspan").remove();

    let textElement = this.tooltip.select(".tooltip-text")
      .attr("x", 10)
      .attr("y", 20);

    textElement.append("tspan")
      .style("font-weight", "bold")
      .text(`Mois: ${data.month}`);
    
    let yOffset = 20;

    Object.entries(data).forEach(([key, value], index) => {
      if (key !== 'month') {
        textElement.append("tspan")
          .attr("x", 10)
          .attr("dy", yOffset)
          .text(`${key}: ${value}`);
      }
    });

    let totalCrimes = 0;
    for (let [key, value] of Object.entries(data)) {
      if (key !== 'month') {
        totalCrimes += Number(value) || 0;
      }
    }

    textElement.append("tspan")
          .attr("x", 10)
          .attr("dy", yOffset)
          .text(`Total: ${totalCrimes}`);

    const bbox = this.tooltip.select(".tooltip-text").node().getBBox();
    this.tooltip.select(".tooltip-rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", bbox.width + 20)
      .attr("height", bbox.height + 20);
  
    let x = currentXPosition;
    let y = currentYPosition - bbox.height - 10; 
    const offsetX = 20;
    const offsetY = 30;
  
    if (x + bbox.width + offsetX > this.width) {
      x = this.width - bbox.width - offsetX;
    }
  
    if (x < offsetX) {
      x = offsetX;
    }
  
    if (y < offsetY) {
      y = currentYPosition + offsetY;
    }
  
    this.tooltip
      .attr("transform", `translate(${x},${y})`)
      .raise()
      .transition()
      .style("opacity", 1);
  }

  private transformDate(xValue: Date) {
    const date = new Date(xValue);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return monthKey;
  }
  
  private handleMouseOut() {
    this.tooltip.transition().style("opacity", 0);
  }

  private drawLegend(categories: string[]) {
    const color = this.createColorScale(categories);
    const legendSpacing = 4;
    const legendRectSize = 12;
    const legendXOffset = this.width - 850;
    const legendYOffset = 0;

    const legend = this.svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d: any, i: number) {
        const height = legendRectSize + legendSpacing;
        const offset =  height * color.domain().length / 2 - 50;
        const horz = legendXOffset ;
        const vert = i * height - offset;
        return `translate(${horz},${vert + legendYOffset})`;
      });

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', color)
      .style('stroke', color);

    legend.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d: any) { return d; });
  }

  private annotateSpecialDates(x: d3.ScaleTime<number, number>) {
    const specialDate1 = new Date('2020-03-15');
      this.svg.append('line')
        .style('stroke', 'white') 
        .style('stroke-width', 2) 
        .style('stroke-dasharray', '3, 3')
        .attr('x1', x(specialDate1))
        .attr('x2', x(specialDate1))
        .attr('y1', 0) 
        .attr('y2', this.height); 
  
    this.svg.append('text')
      .attr('x', x(specialDate1) - 95)
      .attr('y', 125)
      .style('fill', 'black')
      .text('Début de la première vague'); 
      
    this.svg.append('text')
      .attr('x', x(specialDate1) - 110) 
      .attr('y', 140)
      .style('fill', 'black')
      .text('de COVID et premier confinement');
      

    const specialDate2 = new Date('2022-04-15');
    this.svg.append('line') 
      .style('stroke', 'white') 
      .style('stroke-width', 2) 
      .style('stroke-dasharray', '3, 3') 
      .attr('x1', x(specialDate2)) 
      .attr('x2', x(specialDate2)) 
      .attr('y1', 0)
      .attr('y2', this.height);

    this.svg.append('text')
      .attr('x', x(specialDate2) - 110) 
      .attr('y', 85) 
      .style('fill', 'black') 
      .text('Levé de la majorité des mesures'); 

    this.svg.append('text')
      .attr('x', x(specialDate2) - 60)
      .attr('y', 100)
      .style('fill', 'black')
      .text('contre la COVID');
  }

  private createColorScale(categories: string[]) {
    const customColors = ['#ffc000', '#0f9ed5', '#db5757', '#4ea72e', '#747474', '#d86ecc'];
    return d3.scaleOrdinal(customColors).domain(categories);
  }

  private parseYearMonthToDate(monthString: string): Date {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month - 1);
  }
}
