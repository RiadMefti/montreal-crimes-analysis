import { Component } from '@angular/core';
import * as d3 from 'd3';
import rewind from '@turf/rewind';
import * as geojson from 'geojson';
import { DataService } from '../../services/data.service';
import { mapPDQ } from '../../../assets/mapPDQ';

@Component({
  selector: 'app-choropleth-chart',
  standalone: true,
  imports: [/*MatSortModule, MatTextColumn*/],
  templateUrl: './choropleth-chart.component.html',
  styleUrl: './choropleth-chart.component.scss'
})

export class ChoroplethChartComponent {
  montrealCrimeData: any;
  constructor(private dataService: DataService) {}
  montrealPopulationByAge: any;
  montrealGeoJson: any;
  columnsToDisplay = ["typeCrime", "somme"]

  crimesSummary: {[arrond: string] : number;} = {}

  crimesByTypeSummary: {[arrond: string] : number;} = {}

  ngOnInit() {
    this.getMontrealCrimeData().then(() => this.drawMap());
    this.getMontrealPopulationByAge();
    this.getMontrealGeoJson();
    // this.averageCrimesByArrond();
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
      // await this.getCrimesSummary();
      var populationByArrond = (arrond:string) => this.getMontrealCrimesByArrond(arrond);

      d3.select('.graph')
      .select('svg')
      .append('g')
      .attr('id', 'map-g')
      .attr('width', 800)
      .attr('height', 625)

      let mouseOver = function(d: any) {
        d3.selectAll(".Neighborhood")
          .transition()
          .duration(200)
          .style("opacity", .5)
        d3.select(`[id='${d.properties['NOM']}']`)
          .transition()
          .duration(200)
          .style("opacity", 1)
      }
//[id='Rosemont-La Petite-Patrie']
      let mouseLeave = function(d: any) {
        d3.selectAll(".Neighborhood")
          .transition()
          .duration(200)
          .style("opacity", .8)
      }

      let click = function(d: any) {
        d3.select(".info-tab")
        .transition()
        .duration(200)
        .text(d.properties['NOM'])
      }

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
      .attr("class", function(d){ return "Neighborhood" } )
      .attr("id", function(d)
      {
        if(d == null || d.properties == null){
          return "";
        }
        return d.properties['NOM'];
      })
      .attr("fill", function (d) {
        if(d == null || d.properties == null){
          return colorScale(0);
        }
        return colorScale(populationByArrond(d.properties['NOM']));
      })
      .on("mouseover", function(event, d){ mouseOver(d) })
      .on("mouseleave", function(event, d){ mouseLeave(d) })
      .on("click",  function(event, d){ click(d) });

 
    })

    } catch(error){
      console.log(error)
    }
  }

  getMontrealCrimesByArrond(arrond: string){
    var sum = 0;

    this.montrealCrimeData.forEach((crime: any) => {if(crime?.ARRONDISSEMENT === arrond) sum += 1});

    if(sum){
      return sum;
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
  /*averageCrimesByArrond(){
    var crimesSum: {[arrond: string] : number;} = {}
    this.getMontrealGeoJson().then((data: any) => {
      var montrealMap: geojson.FeatureCollection = data as  geojson.FeatureCollection<geojson.Geometry, geojson.GeoJsonProperties>;

      this.montrealCrimeData.forEach((crime: any) => {
        let lon = crime?.LONGITUDE;
        let lat = crime?.LATITUDE;
  
        for(let feature of montrealMap.features) {
          if (lon === undefined || lat === undefined || lon === null || lat === null) {
            if (crime.PDQ === undefined || crime.PDQ === null) {
              continue;
            }
            if (crime.PDQ === 50 || crime.PDQ === 55) {
              continue;
            }
            const pdq: number = crime.PDQ;
            lon = mapPDQ[pdq][1];
            lat = mapPDQ[pdq][0];
          }
          if(d3.geoContains(feature, [lon, lat])) {
            if(feature == null || feature.properties == null){
              continue;
            }
            /*console.log(feature);

            if(crimesSum[feature.properties['NOM']] == undefined){
              crimesSum[feature.properties['NOM']] = 1;
              break;
            }
            crimesSum[feature.properties['NOM']] = crimesSum[feature.properties['NOM']] + 1;
  
            break;
            crime['ARRONDISSEMENT'] = feature.properties['NOM'];
          }
        }
      })
      console.log(this.montrealCrimeData)
      const json = JSON.stringify(this.montrealCrimeData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      
    })

    
    console.log(JSON.stringify(crimesSum))
  }*/

  async getMontrealCrimeData() {
    this.montrealCrimeData = await this.dataService.getMontrealCrimeData();
    console.log("Crime data")
    console.log(this.montrealCrimeData);
    this.crimeFilter('Méfait');
    //this.averageCrimesByArrond();
  }

  // Filtre la liste de crime selon la catégorie du crime
  crimeFilter(filter: string) {
    const res = this.montrealCrimeData.filter((crime: { [x: string]: string; }) => crime['CATEGORIE'] == filter);
    console.log(this.dataService.prepareDataForChoropleth(res));
  }
}
