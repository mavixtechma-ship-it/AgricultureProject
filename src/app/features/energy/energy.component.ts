import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { DataService } from '../../core/data/data.service';
import { ElectricityPoint } from '../../core/data/models';
import { ThemeService } from '../../core/theme/theme.service';
import { chartData, chartOptions } from '../../shared/util/chart';
import { avg, byDay, fmtDayHour } from '../../shared/util/format';
import { fieldResource } from '../../shared/util/loadable';
import { KpiTileComponent } from '../../shared/ui/kpi-tile.component';
import { PanelComponent } from '../../shared/ui/panel.component';

@Component({
  selector: 'app-energy',
  imports: [ChartModule, KnobModule, FormsModule, KpiTileComponent, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './energy.component.html',
})
export class EnergyComponent {
  private readonly data = inject(DataService);
  private readonly theme = inject(ThemeService);

  protected readonly refresh = signal(0);
  protected readonly state = fieldResource((id) => this.data.sensors('electricity', id), this.refresh);
  protected readonly loading = computed(() => this.state().status === 'loading');
  private readonly points = computed<ElectricityPoint[]>(() => this.state().data?.points ?? []);

  protected readonly now = computed(() => {
    const p = this.points();
    return p.length ? p[p.length - 1] : null;
  });

  protected readonly kpi = computed(() => {
    const last24 = this.points().slice(-24);
    if (!last24.length) return null;
    return {
      solarHours: last24.filter((x) => x.lightIntensity > 200).length,
      minBattery: Math.min(...last24.map((x) => x.battery)),
      peakTemp: Math.max(...last24.map((x) => x.temperature)),
    };
  });

  protected readonly batteryColor = computed(() => {
    const b = this.now()?.battery ?? 100;
    return b < 30 ? 'var(--err)' : b < 50 ? 'var(--amber)' : 'var(--accent)';
  });

  protected readonly solar = computed(() => {
    const p = this.points();
    return chartData(this.theme, p.map((x) => fmtDayHour(x.ts)), [
      { label: 'Irradiance (W/m²)', data: p.map((x) => x.lightIntensity), color: '--chart-2', fill: true },
      { label: 'Battery (%)', data: p.map((x) => x.battery), color: '--chart-1', axis: 'y1' },
    ]);
  });
  protected readonly solarOptions = computed(() =>
    chartOptions(this.theme, 2, { unit: '', min: 0, max: 1100, y1Unit: '%', y1Min: 0, y1Max: 100 })
  );

  protected readonly temp = computed(() => {
    const p = this.points();
    return chartData(this.theme, p.map((x) => fmtDayHour(x.ts)), [
      { label: 'Enclosure temperature (°C)', data: p.map((x) => x.temperature), color: '--chart-4' },
    ]);
  });
  protected readonly tempOptions = computed(() => chartOptions(this.theme, 1, { unit: '°' }));

  protected readonly ec = computed(() => {
    const days = byDay(this.points(), (g) => avg(g.map((x) => x.conductivity)));
    return chartData(this.theme, days.map((d) => d.label), [
      { label: 'Mean conductivity (µS/cm)', data: days.map((d) => Math.round(d.value)), color: '--chart-3', type: 'bar' },
    ]);
  });
  protected readonly ecOptions = computed(() => chartOptions(this.theme, 1, { min: 0 }));
}
