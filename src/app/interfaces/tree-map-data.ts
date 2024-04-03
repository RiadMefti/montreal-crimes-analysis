import { CrimesTypes } from "../enums/crimes-types"

export interface TreeMapData {
    pdq: string,
    [CrimesTypes.infractionsCausingDeath]: number,
    [CrimesTypes.introduction]: number,
    [CrimesTypes.mischief]: number,
    [CrimesTypes.TheftInOrFromMotorizedVehicle]: number,
    [CrimesTypes.TheftOfMotorizedVehicle]: number,
    [CrimesTypes.robbery]: number,
    [CrimesTypes.total]: number,
}