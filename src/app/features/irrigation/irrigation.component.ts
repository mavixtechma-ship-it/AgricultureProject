import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DataService } from '../../core/data/data.service';
import { WaterPoint } from '../../core/data/models';
import { ThemeService } from '../../core/theme/theme.service';
import { chartData, chartOptions } from '../../shared/util/chart';
import { avg, byDay, delta24h, fmtDayHour, fmtFull, round, sum } from '../../shared/util/format';
import { fieldResource } from '../../shared/util/loadable';
import { DeviceControlsComponent } from '../../shared/ui/device-controls.component';
import { KpiTileComponent } from '../../shared/ui/kpi-tile.component';
import { PanelComponent } from '../../shared/ui/panel.component';

interface PumpRun {
  start: string;
  hours: number;
  litres: number;
  avgFlow: number;
}

@Component({
  selector: 'app-irrigation',
  imports: [ChartModule, KpiTileComponent, PanelComponent, DeviceControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './irrigation.component.html',
})
export class IrrigationComponent {
  private readonly data = inject(DataService);
  private readonly theme = inject(ThemeService);

  protected readonly refresh = signal(0);
  protected readonly state = fieldResource((id) => this.data.sensors('water', id), this.refresh);
  protected readonly loading = computed(() => this.state().status === 'loading');
  private readonly points = computed<WaterPoint[]>(() => this.state().data?.points ?? []);

  protected readonly kpi = computed(() => {
    const p = this.points();
    if (!p.length) return null;
    const last = p[p.length - 1];
    const temps = p.map((x) => x.temperature);
    return {
      flow: last.isPumpOn ? last.flowRate : 0,
      pumpOn: last.isPumpOn,
      rain7d: round(sum(p.map((x) => x.rainFall)), 1),
      moisture24h: round(avg(p.slice(-24).map((x) => x.soilMoisture)), 1),
      moistureDelta: delta24h(p.map((x) => x.soilMoisture)),
      temp: last.temperature,
      tempDelta: delta24h(temps),
    };
  });

  protected readonly response = computed(() => {
    const p = this.points();
    return chartData(this.theme, p.map((x) => fmtDayHour(x.ts)), [
      { label: 'Soil moisture (%)', data: p.map((x) => x.soilMoisture), color: '--chart-1', fill: true },
      { label: 'Pump flow (L/min)', data: p.map((x) => (x.isPumpOn ? x.flowRate : 0)), color: '--chart-2', type: 'bar', axis: 'y1' },
    ]);
  });
  protected readonly responseOptions = computed(() =>
    chartOptions(this.theme, 2, { unit: '%', min: 0, max: 100, y1Unit: ' L/min', y1Min: 0, y1Max: 40 })
  );

  protected readonly rain = computed(() => {
    const days = byDay(this.points(), (g) => sum(g.map((x) => x.rainFall)));
    return chartData(this.theme, days.map((d) => d.label), [
      { label: 'Rainfall (mm)', data: days.map((d) => d.value), color: '--chart-3', type: 'bar' },
    ]);
  });
  protected readonly rainOptions = computed(() => chartOptions(this.theme, 1, { unit: ' mm', min: 0 }));

  /** Contiguous pump-on intervals, newest first. */
  protected readonly runs = computed<PumpRun[]>(() => {
    const out: PumpRun[] = [];
    let cur: WaterPoint[] = [];
    const flush = () => {
      if (cur.length) {
        const litres = sum(cur.map((x) => x.flowRate * 60));
        out.push({ start: cur[0].ts, hours: cur.length, litres: Math.round(litres), avgFlow: round(avg(cur.map((x) => x.flowRate)), 1) });
      }
      cur = [];
    };
    for (const p of this.points()) {
      if (p.isPumpOn) cur.push(p);
      else flush();
    }
    flush();
    return out.reverse().slice(0, 8);
  });

  protected readonly full = fmtFull;
  protected readonly dayHour = fmtDayHour;
}
