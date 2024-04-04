import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as d3 from 'd3';


type DataPoint = {
  month: string;
  [category: string]: number | string | undefined;
};


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

  private parseYearMonthToDate(monthString: string): Date {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month - 1);
  }

  private drawChart(data: any) {
    const element = this.chartContainer.nativeElement;
    const categories = Object.keys(data[0]).filter(k => k !== 'month');

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);


    const dates: Date[] = data
      .map((d: any) => this.parseYearMonthToDate(d.month));
      
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
      yMax += 1000;
    }

    const y = d3.scaleLinear()
      .domain([0, yMax || 0])
      .range([this.height, 0]);
    
    const customColors = ['#ffc000', '#0f9ed5', '#db5757', '#4ea72e', '#747474', '#d86ecc'];
    const color = d3.scaleOrdinal(customColors).domain(categories);

    const stackedData = d3.stack().keys(categories)(data);

    console.log(stackedData[0]);

    const areaGenerator = d3.area<any>()
      .x(d => x(this.parseYearMonthToDate(d.data.month)))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    this.svg.selectAll('.layer')
      .data(stackedData)
      .enter()
      .append('path')
      .attr('class', 'layer')
      .attr('d', areaGenerator)
      .style('fill', (d: { key: string; }) => color(d.key));

    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(x));

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y));


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

    const specialDate1 = new Date('2020-03-15');
      this.svg.append('line') // Append a new line element to your SVG
        .style('stroke', 'white') // Set the line color
        .style('stroke-width', 2) // Set the line width
        .style('stroke-dasharray', '3, 3') // Optional: make the line dashed
        .attr('x1', x(specialDate1)) // Set the x position for the start of the line
        .attr('x2', x(specialDate1)) // Set the x position for the end of the line (same as x1 for a vertical line)
        .attr('y1', 0) // Set the y position for the start of the line (top of the SVG)
        .attr('y2', this.height); // Set the y position for the end of the line (bottom of the SVG, adjusted for margins)
  
    this.svg.append('text')
      .attr('x', x(specialDate1) - 95) // Position the label right beside the line
      .attr('y', 125) // Position the label near the top of the chart
      .style('fill', 'black') // Set the text color to match the line
      .text('Début de la première vague'); // Replace with the actual significance of the date
      
    this.svg.append('text')
      .attr('x', x(specialDate1) - 110) // Position the label right beside the line
      .attr('y', 140) // Position the label near the top of the chart
      .style('fill', 'black') // Set the text color to match the line
      .text('de COVID et premier confinement'); // Replace with the actual significance of the date
      

    const specialDate2 = new Date('2022-04-15');
    this.svg.append('line') // Append a new line element to your SVG
      .style('stroke', 'white') // Set the line color
      .style('stroke-width', 2) // Set the line width
      .style('stroke-dasharray', '3, 3') // Optional: make the line dashed
      .attr('x1', x(specialDate2)) // Set the x position for the start of the line
      .attr('x2', x(specialDate2)) // Set the x position for the end of the line (same as x1 for a vertical line)
      .attr('y1', 0) // Set the y position for the start of the line (top of the SVG)
      .attr('y2', this.height); // Set the y position for the end of the line (bottom of the SVG, adjusted for margins)

    this.svg.append('text')
      .attr('x', x(specialDate2) - 110) // Position the label right beside the line
      .attr('y', 85) // Position the label near the top of the chart
      .style('fill', 'black') // Set the text color to match the line
      .text('Levé de la majorité des mesures'); // Replace with the actual significance of the date

    this.svg.append('text')
      .attr('x', x(specialDate2) - 60) // Position the label right beside the line
      .attr('y', 100) // Position the label near the top of the chart
      .style('fill', 'black') // Set the text color to match the line
      .text('contre la COVID'); // Replace with the actual significance of the date
      
  }
}
