export interface Field {
  id: string;
  farmId: string;
  name: string;
  crop: string;
  areaHa: number;
  soil: string;
}

export interface Farm {
  id: string;
  name: string;
  region: string;
  areaHa: number;
  fields: Omit<Field, 'farmId'>[];
}

export interface WaterPoint {
  ts: string;
  isPumpOn: boolean;
  /** L/min */
  flowRate: number;
  /** % RH */
  humidity: number;
  /** °C */
  temperature: number;
  /** mm in the hour */
  rainFall: number;
  /** % VWC */
  soilMoisture: number;
}

export interface ElectricityPoint {
  ts: string;
  /** enclosure °C */
  temperature: number;
  /** W/m² */
  lightIntensity: number;
  /** µS/cm */
  conductivity: number;
  /** % */
  battery: number;
}

export interface FertilizerPoint {
  ts: string;
  /** % VWC at 30 cm */
  soilMoisture: number;
  phLevel: number;
  humidity: number;
  isFertilizerOn: boolean;
}

export type SensorFamily = 'water' | 'electricity' | 'fertilizer';

export interface SensorPointMap {
  water: WaterPoint;
  electricity: ElectricityPoint;
  fertilizer: FertilizerPoint;
}

export interface SensorSeries<T> {
  fieldId: string;
  intervalMinutes: number;
  from: string;
  to: string;
  points: T[];
}

export type DeviceKind = 'pump' | 'doser';

export interface Device {
  id: string;
  fieldId: string;
  kind: DeviceKind;
  name: string;
  on: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'water' | 'energy' | 'nutrients';

export interface FarmAlert {
  id: string;
  fieldId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  raisedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}
