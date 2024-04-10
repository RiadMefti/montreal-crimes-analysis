import { Injectable } from '@angular/core';
import { csv, autoType, DSVParsedArray, DSVRowString } from 'd3'
import { RadialChartData } from '../components/radial-bar-chart/radial-bar-chart.component';
import { json } from 'd3-fetch';
import { NeighborhoodData } from '../interfaces/scatterplot';
@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  async getMontrealCrimeData(): Promise<any> {
    const jsonFile = '../../assets/actes-criminels.json';
    const obj: any = await json(jsonFile);
    obj.forEach((element: any) => {
      element['DATE'] = new Date(element['DATE']);
    });
    return obj;
  }

  async getTreeMapData(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/tree-map-data.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealPopulation() {
    const csvFile = '../../assets/montreal_population.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealPopulationByAge(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/montreal_population_by_age_2021.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealPopulationBySalary(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/montreal_population_by_highest_salary_2021.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealPopulationByDegree(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/montreal_population_by_highest_degree_2021.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealPopulationByEthnicity(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/montreal_population_by_ethnicity_2021.csv';
    return await csv(csvFile, autoType)
  }

  prepareDataForChoropleth(data: any) {
    data.map((element: any) => {
      element['PDQ'];
    })
    const pdq = [...new Set(data.map((element: any) => element['PDQ'] ))];
    const result: any[] = [];
    pdq.forEach((item) => {
      const crimesPerPDQ: any = data.filter((element: any) => element['PDQ'] == item);
      const years = [...new Set(crimesPerPDQ.map((element: any) => element['DATE'].getFullYear() ))];
      let count = 0;
      years.forEach((year) => {
        const instance = crimesPerPDQ.filter((element: any) => element.DATE.getFullYear() == year);
        count += instance.length;
      });
      const obj = {
        'PDQ': item,
        'Nombre de crimes en moyenne par années': count / years.length,
      }
      result.push(obj);
    })
    return result;
  }

  async prepareDataForRadialBarChart(): Promise<RadialChartData[]> {

    const data: any = await this.getMontrealCrimeData();
    const count = {
      'Jours': 0,
      'Soir': 0,
      'Nuit': 0
    };
    data.forEach((row: { [x: string]: any; }) => {
      // Assuming the QUART column contains the time of day information
      const timeOfDay = row['QUART'];
      if (timeOfDay === 'jour') {
        count['Jours']++;
      } else if (timeOfDay === 'soir') {
        count['Soir']++;
      } else if (timeOfDay === 'nuit') {
        count['Nuit']++;
      }
    });

    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }

  prepareDataStackedAreaChart(data: any): any[] {
    const allCategories = [
      'Vol de véhicule à moteur',
      'Vol dans / sur véhicule à moteur',
      'Introduction',
      'Vols qualifiés',
      'Méfait',
      'Infractions entrainant la mort'
    ]; 
  
    const dataByMonth = data.reduce((accumulator: { [key: string]: { [category: string]: number } }, currentValue: any) => {
      const date = new Date(currentValue.DATE);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  
      if (!accumulator[monthKey]) {
        accumulator[monthKey] = {};
        allCategories.forEach(category => {
          accumulator[monthKey][category] = 0;
        });
      }
  
      const correctedCategory = this.replaceIncorrectCharacters(currentValue.CATEGORIE);
      accumulator[monthKey][correctedCategory] = (accumulator[monthKey][correctedCategory] || 0) + 1;
  
      return accumulator;
    }, {});
  
    let preparedData = Object.entries(dataByMonth).map(([month, categories]) => ({
      month,
      ...categories as { [key: string]: number }
    }));
    preparedData = preparedData.filter(dataPoint => dataPoint.month !== '2014-12');


    preparedData.sort((a, b) => a.month.localeCompare(b.month));
  
    return preparedData;
  }

  async getNeighborhoodData(): Promise<NeighborhoodData[]> {
    const jsonFile = '../../assets/neighborhood_data.json';
    const data = await json(jsonFile) as NeighborhoodData[];
    return data;
  }

  private replaceIncorrectCharacters(text: string): string {
    return text
      .replace(/Vol de v�hicule � moteur/g, 'Vol de véhicule à moteur')
      .replace(/Vols qualifi�s/g, 'Vols qualifiés')
      .replace(/M�fait/g, 'Méfait')
      .replace(/Vol dans \/ sur v�hicule � moteur/g, 'Vol dans / sur véhicule à moteur');
  }
}
