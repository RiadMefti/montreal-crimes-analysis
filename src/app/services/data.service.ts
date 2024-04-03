import { Injectable } from '@angular/core';
import { csv, autoType, DSVParsedArray } from 'd3'

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  async getTreeMapData(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/tree-map-data.csv';
    return await csv(csvFile, autoType)
  }

  async getMontrealCrimeData(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/actes-criminels.csv';
    return await csv(csvFile, autoType)
  }

  prepareDataStackedAreaChart(data: any) {
    const dataByWeek = data.reduce((accumulator: { [x: string]: { [x: string]: any; }; }, currentValue: { DATE: string | number | Date; CATEGORIE: any; }) => {
      const date = new Date(currentValue.DATE);
      const weekNumber = this.getWeek(date);
      const year = date.getFullYear();
      const weekKey = `${year}-S${String(weekNumber).padStart(2, '0')}`;
    
      if (!accumulator[weekKey]) {
        accumulator[weekKey] = {};
      }
    
      const correctedCategory = this.replaceIncorrectCharacters(currentValue.CATEGORIE);
      accumulator[weekKey][correctedCategory] = (accumulator[weekKey][correctedCategory] || 0) + 1;
    
      return accumulator;
    }, {});

    const preparedData = Object.keys(dataByWeek).map(week => {
      return {
        week,
        ...dataByWeek[week]
      };
    });    

    preparedData.sort((a, b) => {
      return a.week.localeCompare(b.week);
    });

    return preparedData;
  }

  private getWeek(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private replaceIncorrectCharacters(text: string): string {
    return text
      .replace(/Vol de v�hicule � moteur/g, 'Vol de véhicule à moteur')
      .replace(/Vols qualifi�s/g, 'Vols qualifiés')
      .replace(/M�fait/g, 'Méfait')
      .replace(/Vol dans \/ sur v�hicule � moteur/g, 'Vol dans / sur véhicule à moteur');
    }
}
