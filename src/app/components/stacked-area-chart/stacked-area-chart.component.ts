import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as d3 from 'd3';


type DataPoint = {
  week: string;
  [category: string]: number | string | undefined;
};

interface StackedSeriesPoint {
  0: number; // Lower bound of the stack segment (y0)
  1: number; // Upper bound of the stack segment (y1)
  data: DataPoint; // Your original data point type
}

@Component({
  selector: 'app-stacked-area-chart',
  standalone: true,
  imports: [],
  templateUrl: './stacked-area-chart.component.html',
  styleUrls: ['./stacked-area-chart.component.scss']
})


export class StackedAreaChartComponent implements OnInit {
  @ViewChild('chart') chartContainer!: ElementRef;

  private margin = { top: 20, right: 30, bottom: 40, left: 50 };
  private svg: any;
  private width: number = 960 - this.margin.left - this.margin.right;
  private height: number = 500 - this.margin.top - this.margin.bottom;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.getMontrealCrimeData();
  }

  private async getMontrealCrimeData() {
    try {
      const data = await this.dataService.prepareDataStackedAreaChart();
      this.drawChart(data);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  }

  private parseISOWeekToDate(weekString: String) {
    const year = Number(weekString.split("-")[0]);
    const week = Number(weekString.split("S")[1]);
    let date = new Date(year, 0, 1);
    
    let dayShift = (date.getDay() === 0) ? -6 : 1 - date.getDay();
    let firstThursday = new Date(date.setDate(1 + dayShift));
    
    let weekTime = firstThursday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000;

    date.setTime(weekTime);
    
    if (week === 1 && date.getFullYear() > year) {
        date = new Date(year, 0, 1);
    }
    return date;
  }

  private drawChart(data: any) {
    const element = this.chartContainer.nativeElement;
    const categories = Object.keys(data[0]).filter(k => k !== 'week');

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);


    const dates: Date[] = data
      .map((d: any) => this.parseISOWeekToDate(d.week));
      
    const x = d3.scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, this.width]);

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
    if(typeof yMax === 'number') {
      yMax += 200;
    }

    const y = d3.scaleLinear()
      .domain([0, yMax || 0])
      .range([this.height, 0]);
    
    const customColors = ['#ffc000', '#0f9ed5', '#db5757', '#4ea72e', '#747474', '#d86ecc'];
    const color = d3.scaleOrdinal(customColors).domain(categories);

    const stackedData = d3.stack().keys(categories)(data);

    console.log(stackedData[0]);

    const areaGenerator = d3.area<StackedSeriesPoint>()
      .x((d) => x(this.parseISOWeekToDate(d.data.week)))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    this.svg.selectAll('.layer')
      .data(stackedData)
      .enter()
      .append('path')
      .attr('class', 'layer')
      .attr('d', areaGenerator)
      .style('fill', (d: { key: string; }) => color(d.key))
      .on('mouseover', (d: { data: { [x: string]: any; week: any; }; }, i: any) => this.showTooltip(d, i))
      .on('mouseout', this.hideTooltip);

    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(x));

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y));


    const legendSpacing = 4;
    const legendRectSize = 12; 
    const legendXOffset = this.width - 200; 
    const legendYOffset = 0;
    
    const legend = this.svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d: any, i: number) {
        const height = legendRectSize + legendSpacing;
        const offset =  height * color.domain().length / 2 - 50;
        const horz = legendXOffset;
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


  showTooltip(d: { data: { [x: string]: any; week: any; }; }, i: any) {
    /* console.log(d); */
  }
  
  hideTooltip() {
    d3.select('#tooltip')
      .style('display', 'none');
  }
}
