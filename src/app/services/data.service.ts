import { Injectable } from '@angular/core';
import { csv, autoType, DSVParsedArray } from 'd3'

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }


  // It shows error in terminal but works correctly... Maybe due to the fact we use server side rendering.
  async getTreeMapData(): Promise<DSVParsedArray<object> | undefined> {
    const csvFile = '../../assets/tree-map-data.csv';
    return await csv(csvFile, autoType)
  }
}
