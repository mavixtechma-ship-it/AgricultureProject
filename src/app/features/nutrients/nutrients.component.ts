import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DataService } from '../../core/data/data.service';
import { FertilizerPoint } from '../../core/data/models';
import { ThemeService } from '../../core/theme/theme.service';
import { chartData, chartOptions } from '../../shared/util/chart';
import { delta24h, fmtDay, fmtDayHour, fmtFull } from '../../shared/util/format';
import { fieldResource } from '../../shared/util/loadable';
import { DeviceControlsComponent } from '../../shared/ui/device-controls.component';
import { KpiTileComponent } from '../../shared/ui/kpi-tile.component';
import { PanelComponent } from '../../shared/ui/panel.component';

const PH_MIN = 6.0;
const PH_MAX = 6.8;

interface HeatCell {
  ts: string;
  on: boolean;
  ph: number;
}

@Component({
  selector: 'app-nutrients',
  imports: [ChartModule, KpiTileComponent, PanelComponent, DeviceControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrients.component.html',
  styles: `
    .heat { display: grid; grid-template-columns: 72px repeat(24, minmax(10px, 1fr)); gap: 3px; min-width: 560px; }
    .cell { height: 22px; border-radius: 4px; background: var(--surface-2); border: 1px solid var(--border); }
    .cell.on { background: var(--accent); border-color: var(--accent); }
    .cell.off-band { box-shadow: inset 0 -3px 0 var(--amber); }
  `,
})
export class NutrientsComponent {
  private readonly data = inject(DataService);
  private readonly theme = inject(ThemeService);

  protected readonly phMin = PH_MIN;
  protected readonly phMax = PH_MAX;
  protected readonly refresh = signal(0);
  protected readonly state = fieldResource((id) => this.data.sensors('fertilizer', id), this.refresh);
  protected readonly loading = computed(() => this.state().status === 'loading');
  private readonly points = computed<FertilizerPoint[]>(() => this.state().data?.points ?? []);

  protected readonly kpi = computed(() => {
    const p = this.points();
    if (!p.length) return null;
    const last = p[p.length - 1];
    const ph = last.phLevel;
    return {
      ph: ph.toFixed(2),
      phDelta: delta24h(p.map((x) => x.phLevel)),
      inBand: ph >= PH_MIN && ph <= PH_MAX,
      moisture: last.soilMoisture,
      moistureDelta: delta24h(p.map((x) => x.soilMoisture)),
      dosingHours: p.filter((x) => x.isFertilizerOn).length,
      humidity: last.humidity,
    };
  });

  protected readonly phChart = computed(() => {
    const p = this.points();
    return chartData(this.theme, p.map((x) => fmtDayHour(x.ts)), [
      { label: 'Soil pH', data: p.map((x) => x.phLevel), color: '--chart-1', fill: false },
      { label: `Target min (${PH_MIN})`, data: p.map(() => PH_MIN), color: '--chart-4', dashed: true },
      { label: `Target max (${PH_MAX})`, data: p.map(() => PH_MAX), color: '--chart-4', dashed: true },
    ]);
  });
  protected readonly phOptions = computed(() => chartOptions(this.theme, 3, { min: 5.4, max: 7.8 }));

  /** 7 rows (days) × 24 columns (hours): doser state, with off-target pH underlined in amber. */
  protected readonly heat = computed(() => {
    const rows = new Map<string, (HeatCell | null)[]>();
    for (const p of this.points()) {
      const d = new Date(p.ts);
      const key = d.toDateString();
      if (!rows.has(key)) rows.set(key, Array.from({ length: 24 }, (): HeatCell | null => null));
      rows.get(key)![d.getHours()] = { ts: p.ts, on: p.isFertilizerOn, ph: p.phLevel };
    }
    return [...rows.entries()].map(([, cells]) => {
      const first = cells.find((c) => !!c);
      return { label: first ? fmtDay(first.ts) : '', cells };
    });
  });
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

  protected cellTitle(c: HeatCell | null): string {
    if (!c) return 'No reading';
    return `${fmtFull(c.ts)} — doser ${c.on ? 'on' : 'off'}, pH ${c.ph.toFixed(2)}`;
  }
  protected offBand(c: HeatCell | null): boolean {
    return !!c && (c.ph < PH_MIN || c.ph > PH_MAX);
  }
}
