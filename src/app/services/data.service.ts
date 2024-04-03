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
}
