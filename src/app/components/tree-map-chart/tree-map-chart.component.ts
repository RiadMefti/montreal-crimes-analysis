import { Component, ElementRef, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import { TreeMapData } from '../../interfaces/tree-map-data';
import * as d3 from 'd3';
import { CrimesTypes } from '../../enums/crimes-types';
import { TreeNode } from '../../interfaces/tree-node';


@Component({
  selector: 'app-tree-map-chart',
  standalone: true,
  imports: [],
  templateUrl: './tree-map-chart.component.html',
  styleUrl: './tree-map-chart.component.scss'
})
export class TreeMapChartComponent {
  @ViewChild('chart') chartContainer!: ElementRef;
  
  maxFontWidth = Infinity;
  maxFontHeight = 18;
  initialFontSize = 12;

  constructor(private dataService: DataService) {}

  ngAfterViewInit() {
    this.createChart();
  }

  private async createChart() {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;

    // Your D3 chart code goes here
    const data = await this.dataService.getTreeMapData() as unknown as TreeMapData[];
    console.info('data', data)

    const width = 1000;
    const height = 800;

    // Create a hierarchical structure for the tree map layout
    const root = d3.hierarchy({ children: data })
      .sum((d: any) => d[CrimesTypes.total]);

    // Initialize the tree map layout
    const treemap = d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true);

    // Generate the tree map layout
    treemap(root as any);

    // Create SVG element
    const svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Define color scale
    const colorScale = d3.scaleLinear()
      .domain([0, d3.max(root.leaves(), (d: any) => d.data[CrimesTypes.total])])
      .range(['#F7D7D0', '#90431B'] as any); // Adjust the range of colors as needed

    // Define tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '10px')
      .style('border-radius', '10px')
      .style('opacity', 0)
      .on('mousemove', (mouseEvent, d: any) => {
        // Show tooltip
        tooltip.style('opacity', .9);
      })
      .on('mouseleave', () => {
        // Hide tooltip when mouse leaves tooltip
        tooltip.style('opacity', 0);
      });
    
    // Append rectangles for each data point
    svg.selectAll('pdq-rect')
      .data(root.leaves())
      .enter()
      .append('rect')
      .attr('class', 'pdq-rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => colorScale(d.data[CrimesTypes.total]))
      .style('stroke', 'white')
      .style('stroke-width', 1)
      .on('mouseover', function() {
        d3.selectAll('rect').transition().duration(200).style('opacity', '0.5');
        d3.select(this)
          .transition().duration(200).style('opacity', 1)
          .style('stroke', 'white')
          .style('stroke-width', 1);
      })
      .on('mouseout', function() {
        d3.selectAll('rect').transition().duration(200).style('opacity', '1');
        d3.select(this)
          .transition().duration(200).style('opacity', 1)
          .style('stroke', 'white')
          .style('stroke-width', 1);
      })
      .on('mousemove', (mouseEvent, d: any) => {
        // Show tooltip
        tooltip.style('opacity', .9);
        tooltip.html(this.getTooltipContent(d.data))
          .style('left', (mouseEvent.pageX + 10) + 'px')
          .style('top', (mouseEvent.pageY - 0) + 'px');
      })
      .on('mouseleave', () => {
        // Hide tooltip when mouse leaves tooltip
        tooltip.style('opacity', 0);
      });

    const maxTextWidth = (d: TreeNode) => Math.min(this.maxFontWidth, d.x1 - d.x0 - 10); // Adjust 10 to provide padding
    const maxTextHeight = (d: TreeNode) => Math.min(this.maxFontHeight, d.y1 - d.y0 - 20); // Adjust 20 to provide padding

    // Add text labels
    svg.selectAll('.pdq-text')
      .data(root.leaves())
      .enter()
      .append('text')
      .attr('class', 'pdq-text')
      .attr('x', (d: any) => (d.x0 + d.x1) / 2)
      .attr('y', (d: any) => (d.y0 + d.y1) / 2)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text((d: any) => d.data.PDQ)
      .style('font-size', (d: any) => this.calculateFontSize(d, maxTextWidth(d), maxTextHeight(d)) + 'px')
      .style('fill', 'white')
      .on('mousemove', (mouseEvent, d: any) => {
        // Show tooltip
        tooltip.style('opacity', .9);
        tooltip.html(this.getTooltipContent(d.data))
          .style('left', (mouseEvent.pageX + 10) + 'px')
          .style('top', (mouseEvent.pageY - 0) + 'px');
      })

    svg.selectAll('.total-text')
      .data(root.leaves())
      .enter()
      .append('text')
      .attr('class', 'total-text')
      .attr('x', (d: any) => (d.x0 + d.x1) / 2)
      .attr('y', (d: any) => (d.y0 + d.y1) / 2 + this.maxFontHeight) // Adjusted y-coordinate to be below PDQ label
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text((d: any) => `(${d.data[CrimesTypes.total]})`)
      .style('font-size', (d: any) => this.calculateFontSize(d, maxTextWidth(d), maxTextHeight(d)) + 'px')
      .style('fill', 'white')
      .on('mousemove', (mouseEvent, d: any) => {
        // Show tooltip
        tooltip.style('opacity', .9);
        tooltip.html(this.getTooltipContent(d.data))
          .style('left', (mouseEvent.pageX + 10) + 'px')
          .style('top', (mouseEvent.pageY - 0) + 'px');
      });
  }

  // Function to get tooltip content
  getTooltipContent(data: any): string {
    let content = `<h2>Répartition des crimes ${data.PDQ}</h2>`;
    for (const [crimeType, value] of Object.entries(data)) {
      if (crimeType !== 'PDQ' && crimeType !== 'total') {
        content += `${crimeType}: ${value}<br>`;
      }
    }
    return content;
  }

  fitTextInsideRectangle(text: string, maxWidth: number, maxHeight: number): string {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text; // Fallback if canvas is not supported
  
    const fontSize = this.calculateFontSizeFromWidthAndHeight(text, maxWidth, maxHeight, context);
    return fontSize < this.initialFontSize ? '' : text; // Return empty string if fontSize is too small
  }
  
  calculateFontSizeFromWidthAndHeight(text: string, maxWidth: number, maxHeight: number, context: CanvasRenderingContext2D): number {
    let fontSize = this.initialFontSize; // Initial font size
    do {
      context.font = `bold ${fontSize}px sans-serif`;
      const textWidth = context.measureText(text).width;
      const textHeight = fontSize; // Assuming the text height is equal to font size
      if (textWidth < maxWidth && textHeight < maxHeight) {
        fontSize++; // Increase font size until text fits inside the rectangle
      } else {
        break;
      }
    } while (true);
    return fontSize - 1; // Return the last valid font size
  }
  
  calculateFontSize(d: TreeNode, maxWidth: number, maxHeight: number): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 12; // Fallback if canvas is not supported
    return this.calculateFontSizeFromWidthAndHeight(d.data.PDQ, maxWidth, maxHeight, context);
  }
}
