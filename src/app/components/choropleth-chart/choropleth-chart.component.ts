import { Component } from '@angular/core';
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
