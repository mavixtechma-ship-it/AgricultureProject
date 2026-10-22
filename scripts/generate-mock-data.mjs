// Generates deterministic mock data for the AgriSense demo into src/assets/mock/*.json.
// Time series are 8 days × hourly (192 points, index 0 = 00:00) per field, stored column-wise to keep files small.
// Timestamps are NOT stored: the mock backend slices the 168 points (7 days) that end at the current hour of day.
// Usage: npm run gen:mock
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'mock');
mkdirSync(out, { recursive: true });

// Small seeded PRNG (mulberry32) — mock data only, not used for anything security related.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const HOURS = 192;
// Point i is at hour-of-day i % 24.
const hourOf = (i) => i % 24;

const farms = [
  {
    id: 'FARM-N', name: 'Northfield Estate', region: 'Upper Valley', areaHa: 62,
    fields: [
      { id: 'F-101', name: 'North Orchard', crop: 'Citrus', areaHa: 24, soil: 'Sandy loam' },
      { id: 'F-102', name: 'River Plot', crop: 'Wheat', areaHa: 38, soil: 'Clay loam' },
    ],
  },
  {
    id: 'FARM-S', name: 'Sunridge Farm', region: 'South Plains', areaHa: 19,
    fields: [
      { id: 'F-201', name: 'Greenhouse A', crop: 'Tomatoes', areaHa: 3, soil: 'Peat mix' },
      { id: 'F-202', name: 'East Terraces', crop: 'Olives', areaHa: 16, soil: 'Silty loam' },
    ],
  },
];
const fields = farms.flatMap((f) => f.fields.map((x) => ({ ...x, farmId: f.id })));

const water = [], electricity = [], fertilizer = [];
fields.forEach((field, idx) => {
  const r = rng(1000 + idx * 97);
  const tBase = [24, 22, 27, 25][idx];
  const rainDay = [2, 2, 5, 4][idx];
  const w = { isPumpOn: [], flowRate: [], humidity: [], temperature: [], rainFall: [], soilMoisture: [] };
  const e = { temperature: [], lightIntensity: [], conductivity: [], battery: [] };
  const fz = { soilMoisture: [], phLevel: [], humidity: [], isFertilizerOn: [] };
  let moisture = 38 + r() * 8, battery = 82, ph = 6.4 + r() * 0.3, ec = 320 + r() * 60, deepMoisture = 42;

  for (let i = 0; i < HOURS; i++) {
    const h = hourOf(i), day = Math.floor(i / 24);
    const sun = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    const temp = tBase + 8 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + (r() - 0.5) * 1.6;
    const rain = day === rainDay && h >= 13 && h <= 17 ? round(1 + r() * 4.5, 1) : r() < 0.02 ? round(r() * 0.6, 1) : 0;
    const pumpOn = (h >= 5 && h < 7) || (h >= 19 && h < 20 && day % 2 === 0);
    const flow = pumpOn ? round(14 + r() * 6, 1) : 0;
    moisture = clamp(moisture - 0.35 - sun * 0.25 + (pumpOn ? 3.2 : 0) + rain * 1.6, 12, 78);
    const hum = clamp(78 - (temp - tBase) * 3.4 + rain * 3 + (r() - 0.5) * 4, 22, 98);

    w.isPumpOn.push(pumpOn); w.flowRate.push(flow); w.humidity.push(round(hum, 0));
    w.temperature.push(round(temp)); w.rainFall.push(rain); w.soilMoisture.push(round(moisture));

    const light = round(sun * (880 + r() * 90) * (day === rainDay ? 0.35 : 1), 0);
    battery = clamp(battery + (light > 200 ? 1.6 : -0.9) + (r() - 0.5) * 0.4, 18, 100);
    ec = clamp(ec + (r() - 0.5) * 9 + (rain > 0 ? -6 : 0), 210, 520);
    e.temperature.push(round(temp + sun * 9 + 2)); // enclosure runs hotter than air in the sun
    e.lightIntensity.push(light); e.conductivity.push(round(ec, 0)); e.battery.push(round(battery, 0));

    const dosing = day % 2 === 1 && h >= 6 && h < 8;
    ph = clamp(ph + (dosing ? -0.07 : 0.0028) + (ph > 6.6 ? -0.002 : 0) + (r() - 0.5) * 0.03, 5.6, 7.6);
    deepMoisture = clamp(deepMoisture - 0.12 + (pumpOn ? 1.1 : 0) + rain * 0.7, 18, 70);
    fz.soilMoisture.push(round(deepMoisture)); fz.phLevel.push(round(ph, 2));
    fz.humidity.push(round(clamp(hum + (r() - 0.5) * 3, 20, 99), 0)); fz.isFertilizerOn.push(dosing);
  }
  water.push({ fieldId: field.id, intervalMinutes: 60, metrics: w });
  electricity.push({ fieldId: field.id, intervalMinutes: 60, metrics: e });
  fertilizer.push({ fieldId: field.id, intervalMinutes: 60, metrics: fz });
});

const devices = fields.flatMap((f, i) => [
  { id: `PMP-${f.id.slice(2)}`, fieldId: f.id, kind: 'pump', name: `${f.name} irrigation pump`, on: i % 2 === 0 },
  { id: `DOS-${f.id.slice(2)}`, fieldId: f.id, kind: 'doser', name: `${f.name} fertilizer doser`, on: i === 2 },
]);

const alerts = [
  ['F-101', 'critical', 'water', 'Pump pressure drop', 'Line pressure fell 40 % during the morning cycle — check the drip line for a leak.', 1],
  ['F-202', 'warning', 'energy', 'Battery under 30 %', 'Gateway battery is discharging faster than the 7-day average.', 3],
  ['F-201', 'warning', 'nutrients', 'pH near upper limit', 'Substrate pH reached 6.74; target band is 6.0 – 6.8.', 5],
  ['F-102', 'info', 'water', 'Rain event detected', '4.8 mm of rain recorded; next irrigation cycle postponed.', 9],
  ['F-101', 'info', 'nutrients', 'Dosing cycle completed', 'Fertilizer doser ran for 2 h as scheduled.', 14],
  ['F-202', 'critical', 'water', 'Flow without pressure', 'Pump reported flow while line pressure stayed at 0 — possible leak.', 20],
  ['F-201', 'warning', 'energy', 'Enclosure temperature high', 'Sensor enclosure reached 43 °C at midday.', 26],
  ['F-102', 'info', 'energy', 'Firmware updated', 'Field gateway updated to firmware 2.4.1.', 33],
  ['F-101', 'warning', 'water', 'Irrigation skipped', 'Scheduled 19:00 cycle skipped because the pump was switched off manually.', 41],
  ['F-202', 'info', 'nutrients', 'Conductivity back in range', 'EC returned to 320 µS/cm after flushing.', 52],
  ['F-201', 'critical', 'nutrients', 'Doser stalled', 'Doser motor current spiked and the cycle was aborted.', 70],
  ['F-102', 'warning', 'water', 'Humidity sensor noisy', 'Readings vary ±12 % between samples; recalibration suggested.', 95],
  ['F-101', 'info', 'energy', 'Solar charging resumed', 'Battery charging restored after cloud cover cleared.', 118],
  ['F-202', 'info', 'water', 'Weekly water report ready', 'Total irrigation volume for the week has been computed.', 150],
].map(([fieldId, severity, category, title, message, hoursAgo], i) => ({
  id: `AL-${String(1001 + i)}`, fieldId, severity, category, title, message, hoursAgo, acknowledged: hoursAgo > 60,
}));

const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data));
write('farms.json', farms);
write('sensors-water.json', water);
write('sensors-electricity.json', electricity);
write('sensors-fertilizer.json', fertilizer);
write('devices.json', devices);
write('alerts.json', alerts);
console.log('Mock data written to', out);
