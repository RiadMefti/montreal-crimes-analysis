import { Component } from '@angular/core';
import * as d3 from 'd3';
import rewind from '@turf/rewind';
import * as geojson from 'geojson';
import { DataService } from '../../services/data.service';
import { mapPDQ } from '../../../assets/mapPDQ';
import { MatTableDataSource } from '@angular/material/table';
import { MatSelectChange } from '@angular/material/select';
import { MatSort, Sort } from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatSortModule} from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import * as Legend from "./color-legend.js";

export interface Group {
  category: string,	
  value: number,	
}

export interface CrimeType {
  name: string,
  selected: boolean
}

export interface TabType {
  name: string,
  data: any
}


@Component({
  selector: 'app-choropleth-chart',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSortModule,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: './choropleth-chart.component.html',
  styleUrl: './choropleth-chart.component.scss'
})

export class ChoroplethChartComponent {
  montrealCrimeData: any;
  constructor(private dataService: DataService) {}
  montrealPopulationByAge: any;
  montrealPopulationByDegree: any;
  montrealPopulationBySalary: any;
  montrealPopulationByEthnicity: any;
  montrealGeoJson: any;
  allArrond: any;
  path: any;
  
  columnsToDisplay = ["category", "value"];
  tableCategories: TabType[] = [];
  selectedTableCategory: TabType = {name:"Age", data: ""};
  filterCategories: CrimeType[] = [];
  // selectedCrimeFilters: string[] = [];
  allComplete: boolean = true;

  groups: Group[] = []
  dataSource = new MatTableDataSource(this.groups);
  partOfMontrealChosen: string = 'AGGLOMÉRATION DE MONTRÉAL';
  filteredData: any;

  crimesSummary: {[arrond: string] : number;} = {}

  crimesByTypeSummary: {[arrond: string] : number;} = {}

  ngOnInit() {
    this.getMontrealCrimeData().then(() => {
      this.getAllArrond();
      const projection = d3.geoMercator().center([-73.708879, 45.579611]).scale(70000)
      this.path = d3.geoPath().projection(projection)
      this.drawMap()
    });
    this.getMontrealPopulationByCategories().then(() => {
      this.setTable(this.montrealPopulationByAge);
      this.createCategories();
      this.selectedTableCategory = {name: "Age", data: this.montrealPopulationByAge}
    });
    this.getMontrealGeoJson();
  }

  private createCategories(){
    this.tableCategories = [
      {name: "Age", data: this.montrealPopulationByAge},
      {name: "Degree", data: this.montrealPopulationByDegree},
      {name: "Salary", data: this.montrealPopulationBySalary},
      {name: "Ethnicity", data: this.montrealPopulationByEthnicity}
    ]
  }
  
  onTableSelectionChange(e: any){
    console.log(this.selectedTableCategory)
    this.setTable(this.selectedTableCategory.data)
  }

  private getAllArrond() {
    this.allArrond =  [...new Set(this.montrealCrimeData
      .map((item: { ARRONDISSEMENT: any; }) => item.ARRONDISSEMENT)
      .filter((arrondissement: null) => arrondissement != null)
    )]
    .sort((a: any, b: any) => a.localeCompare(b));
  }

  private setTable(data: any){
    this.groups = []
    data.forEach((ageGroup: any) => {
      let group: Group = {category: ageGroup['CATÉGORIE'], value: ageGroup[this.partOfMontrealChosen]}
      this.groups.push(group)
    })
    this.dataSource = new MatTableDataSource(this.groups);
  }

  someComplete(): boolean {
    if (this.filterCategories == null) {
      return false;
    }
    return this.filterCategories.filter(t => t.selected).length > 0 && !this.allComplete;
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.filterCategories == null) {
      return;
    }
    this.filterCategories.forEach(t => (t.selected = completed));
    this.updateMap();
  }


  updateFiltersCategories(){
    this.allComplete = this.filterCategories != null && this.filterCategories.every(t => t.selected);
    this.updateMap();
  }

  private async drawMap(){
    try{
      d3.select('#map').select('svg')
      .attr('width', 800)
      .attr('height', 625)
      
      var populationByArrond = (arrond:string) => this.getMontrealCrimesByArrond(arrond);
      let maxVal = 0;
      this.allArrond.forEach((arrond: string) => {
        let val  = populationByArrond(arrond);
        if (val > maxVal) maxVal = val;
      });
      
      var colorScale = d3.scaleLinear<string, number>()
      .domain([0, maxVal * 0.15, maxVal * 0.3, maxVal * 0.45, maxVal * 0.6, maxVal * 0.75, maxVal * 0.9, maxVal * 1.05])
      .range(d3.schemeReds[8]);
      if (maxVal === 0) {
        var colorScale = d3.scaleLinear<string, number>()
        .domain([0, 1])
        .range(d3.schemeReds[8]);
      }

      await this.getCrimesSummary();
      
      var setTableFilter = (arrond: string) => {
        this.partOfMontrealChosen = arrond;
        this.setTable(this.selectedTableCategory.data);
      }

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
          .style("opacity", .3)
        d3.select(`[id='${d.properties['NOM']}']`)
          .transition()
          .duration(200)
          .style("opacity", 1)
      }

      let mouseLeave = function(d: any) {
        d3.selectAll(".Neighborhood")
          .transition()
          .duration(200)
          .style("opacity", 1)
      }

      let click = function(d: any) {
        setTableFilter(d.properties['NOM']);
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
      .attr('d', this.path)
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

      Legend.Legend(colorScale)

    })

    } catch(error){
      console.log(error)
    }
  }

  updateMap() {
    this.crimeFilter();

    let populationByArrond = (arrond:string) => this.getMontrealCrimesByArrond(arrond);
    let maxVal = 0;
      this.allArrond.forEach((arrond: string) => {
        let val  = populationByArrond(arrond);
        if (val > maxVal) maxVal = val;
      });
    var colorScale = d3.scaleLinear<string, number>()
    .domain([0, maxVal * 0.15, maxVal * 0.3, maxVal * 0.45, maxVal * 0.6, maxVal * 0.75, maxVal * 0.9, maxVal * 1.05])
    .range(d3.schemeReds[8]);
    if (maxVal === 0) {
      var colorScale = d3.scaleLinear<string, number>()
      .domain([0, 1])
      .range(d3.schemeReds[8]);
    }

    d3.select('#map-g').selectAll('path')
    .transition()
    .duration(200)
    .each(function(d){
      let id = d3.select(this).attr('id')
      d3.select(this).attr("fill", function (d) {
        return colorScale(populationByArrond(id));
      })
    }
    )

  }

  getMontrealCrimesByArrond(arrond: string){
    var sum = 0;
    console.log(this.allComplete)
    if(this.allComplete){
      this.filteredData = this.montrealCrimeData;
    }

    this.filteredData.forEach((crime: any) => {if(crime?.ARRONDISSEMENT === arrond) sum += 1});

    if(sum){
      return sum / 9;
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

  async getMontrealPopulationByCategories() {
    this.montrealPopulationByAge = await this.dataService.getMontrealPopulationByAge();
    this.montrealPopulationByEthnicity = await this.dataService.getMontrealPopulationByEthnicity();
    this.montrealPopulationBySalary = await this.dataService.getMontrealPopulationBySalary();
    this.montrealPopulationByDegree = await this.dataService.getMontrealPopulationByDegree();
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
    this.setCategories()
    //this.averageCrimesByArrond();
  }

  setCategories(){
    const categories: string[] = []
    this.filterCategories = [];
    this.montrealCrimeData.forEach((element: any) => {
      if(!categories.includes(element['CATEGORIE'])){
        categories.push(element['CATEGORIE'])
        this.filterCategories.push({name: element['CATEGORIE'], selected: true})
      }
    });
  }

  // Filtre la liste de crime selon la catégorie du crime
  crimeFilter() {
    const stringSelectedFilters: string[] = this.filterCategories.map((elem) => {
      if(elem.selected) return elem.name;
      return '';
    });
    const res = this.montrealCrimeData.filter((crime: any) => stringSelectedFilters.includes(crime['CATEGORIE']));
    console.log(res);
    this.filteredData = res;
    // console.log(this.dataService.prepareDataForChoropleth(res));
  }
}
