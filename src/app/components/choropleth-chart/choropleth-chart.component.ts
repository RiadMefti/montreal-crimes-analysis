import { Component } from '@angular/core';
import * as d3 from 'd3';
import rewind from '@turf/rewind';
import * as geojson from 'geojson';

@Component({
  selector: 'app-choropleth-chart',
  standalone: true,
  imports: [],
  templateUrl: './choropleth-chart.component.html',
  styleUrl: './choropleth-chart.component.scss'
})
export class ChoroplethChartComponent {

  // montrealMapData: geojson.FeatureCollection;

  constructor() {}

  ngOnInit() {
    this.drawMap();
  }

  //TODO: move method to dataservice
  private async getMapJsonInfo() {
    return d3.json('../../assets/montreal.json')
  }

  private async drawMap(){
    try{
      const projection = d3.geoMercator().center([-73.708879, 45.579611]).scale(70000)
      const path = d3.geoPath().projection(projection)
      d3.select('#map').select('svg')
      .attr('width', 800)
      .attr('height', 625)

      d3.select('.graph')
      .select('svg')
      .append('g')
      .attr('id', 'map-g')
      .attr('width', 800)
      .attr('height', 625)

      // Angular is picky with types, therefore we're using a map with pre inverted polygons to enable color filling
      // https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
      d3.json('../../assets/inverted-montreal.json').then((data) => {
        var montrealMap: geojson.FeatureCollection = data as  geojson.FeatureCollection<geojson.Geometry, geojson.GeoJsonProperties>;
        console.log(montrealMap)
        // TODO: find right type to use rewind and enable fillings
        
        // montrealMap = rewind(montrealMap, {reverse: true});
        d3.select('#map-g').selectAll('path')
        .data(montrealMap.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', 'white') // TODO: create function w colors
        .attr('stroke', '#a7a7a0')
      });

    } catch(error){
      console.log(error)
    }
  }

}
