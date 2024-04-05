import { Component } from '@angular/core';
import * as d3 from 'd3';
import rewind from '@turf/rewind';
import * as geojson from 'geojson';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-choropleth-chart',
  standalone: true,
  imports: [],
  templateUrl: './choropleth-chart.component.html',
  styleUrl: './choropleth-chart.component.scss'
})

export class ChoroplethChartComponent {
  montrealCrimeData: any;
  constructor(private dataService: DataService) {}
  montrealPopulationByAge: any;

  ngOnInit() {
    this.getMontrealCrimeData();
    this.getMontrealPopulationByAge();
    this.drawMap();
  }

  private async drawMap(){
    try{
      const projection = d3.geoMercator().center([-73.708879, 45.579611]).scale(70000)
      const path = d3.geoPath().projection(projection)
      d3.select('#map').select('svg')
      .attr('width', 800)
      .attr('height', 625)

      var colorScale = d3.scaleLinear<string, number>()
      .domain([20000, 40000, 60000, 80000, 100000])
      .range(d3.schemeReds[7]);

      var populationByArrond = (arrond:string) => this.getMontrealCrimesByArrond(arrond);

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
        .attr('stroke', '#a7a7a0')
        .attr("fill", function (d) {
          if(d == null || d.properties == null){
            return colorScale(0);
          }
          return colorScale(populationByArrond(d.properties['NOM']));
        });

        
      });

    } catch(error){
      console.log(error)
    }
  }

  getMontrealCrimesByArrond(arrond: string){
    return 0;  
  }


  async getMontrealPopulationByAge() {
    this.montrealPopulationByAge = await this.dataService.getMontrealPopulationByAge();
    console.log("Population By Age")
    console.log(this.montrealPopulationByAge);
  }

  async getMontrealCrimeData() {
    this.montrealCrimeData = await this.dataService.getMontrealCrimeData();
    console.log("Crime data")
    console.log(this.montrealCrimeData);
    this.crimeFilter('Méfait');
  }

  // Filtre la liste de crime selon la catégorie du crime
  crimeFilter(filter: string) {
    const res = this.montrealCrimeData.filter((crime: { [x: string]: string; }) => crime['CATEGORIE'] == filter);
    console.log(this.dataService.prepareDataForChoropleth(res));
  }
}
