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
  montrealGeoJson: any;

  crimesSummary: {[arrond: string] : number;} = {}

  ngOnInit() {
    this.getMontrealCrimeData();
    this.getMontrealPopulationByAge();
    this.getMontrealGeoJson();
    // this.averageCrimesByArrond();
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
      .domain([100, 500, 1000, 5000, 10000, 15000, 20000,30000,40000,50000])
      .range(d3.schemeReds[7]);

      // TODO legend
      // d3.select('#map').select('svg').append("g")
      // .attr("transform", "translate(20,0)")
      // .append(() => d3.Legend(colorScale, {title: "Healthy life expectancy (years)", width: 260}));
      await this.getCrimesSummary();
      var populationByArrond = (arrond:string) => this.getMontrealCrimesByArrond(arrond);

      d3.select('.graph')
      .select('svg')
      .append('g')
      .attr('id', 'map-g')
      .attr('width', 800)
      .attr('height', 625)

      // Angular is picky with types, therefore we're using a map with pre inverted polygons to enable color filling
      // https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
    
    this.getMontrealGeoJson().then((data) => {
      var montrealMap: geojson.FeatureCollection = data as  geojson.FeatureCollection<geojson.Geometry, geojson.GeoJsonProperties>;
      console.log(montrealMap)
  
      d3.select('#map-g').selectAll('path')
      .data(montrealMap.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('stroke', '#a7a7a0')
      .attr("fill", 'white')
      .attr("fill", function (d) {
        if(d == null || d.properties == null){
          return colorScale(0);
        }
        return colorScale(populationByArrond(d.properties['NOM']));
      });
    })


        

    } catch(error){
      console.log(error)
    }
  }

  getMontrealCrimesByArrond(arrond: string){
    var sum = this.crimesSummary[arrond]

    if(sum){
      return sum
    }
    return 0;  
  }

  async getMontrealGeoJson(){
    this.montrealGeoJson = await d3.json('../../assets/inverted-montreal.json');
    return this.montrealGeoJson;
  }

  async getCrimesSummary(){
    this.crimesSummary = await d3.json('../../assets/crimes-summary.json') as {[arrond: string] : number;};
    return this.crimesSummary;
  }

  async getMontrealPopulationByAge() {
    this.montrealPopulationByAge = await this.dataService.getMontrealPopulationByAge();
    console.log("Population By Age")
    console.log(this.montrealPopulationByAge);
  }

  // this function allows us to make a summary of the crimes. It is only ran once since it takes a few minutes
  averageCrimesByArrond(){
    var crimesSum: {[arrond: string] : number;} = {}
    this.getMontrealGeoJson().then((data: any) => {
      var montrealMap: geojson.FeatureCollection = data as  geojson.FeatureCollection<geojson.Geometry, geojson.GeoJsonProperties>;

      this.montrealCrimeData.forEach((crime: any) => {
        var lon = crime?.LONGITUDE;
        var lat = crime?.LATITUDE;
  
        for(let feature of montrealMap.features) {
          if(d3.geoContains(feature, [lon, lat])) {
            if(feature == null || feature.properties == null){
              continue;
            }

            if(crimesSum[feature.properties['NOM']] == undefined){
              crimesSum[feature.properties['NOM']] = 1;
              break;
            }
            crimesSum[feature.properties['NOM']] = crimesSum[feature.properties['NOM']] + 1;
  
            break;
          }
        }
      })
    })

    
    console.log(JSON.stringify(crimesSum))
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
