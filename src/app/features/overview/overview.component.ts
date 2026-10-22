import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { forkJoin } from 'rxjs';
import { DataService } from '../../core/data/data.service';
import { ThemeService } from '../../core/theme/theme.service';
import { chartData, chartOptions } from '../../shared/util/chart';
import { avg, delta24h, fmtDayHour, fmtFull, fmtRelative, round, sum } from '../../shared/util/format';
import { fieldResource } from '../../shared/util/loadable';
import { DeviceControlsComponent } from '../../shared/ui/device-controls.component';
import { KpiTileComponent } from '../../shared/ui/kpi-tile.component';
import { PanelComponent } from '../../shared/ui/panel.component';
import { SeverityTagComponent } from '../../shared/ui/severity-tag.component';

@Component({
  selector: 'app-overview',
  imports: [ChartModule, KnobModule, FormsModule, RouterLink, KpiTileComponent, PanelComponent, DeviceControlsComponent, SeverityTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  private readonly data = inject(DataService);
  private readonly theme = inject(ThemeService);

  protected readonly refresh = signal(0);
  protected readonly state = fieldResource(
    (id) =>
      forkJoin({
        water: this.data.sensors('water', id),
        power: this.data.sensors('electricity', id),
        nutrients: this.data.sensors('fertilizer', id),
        alerts: this.data.alerts(id),
      }),
    this.refresh
  );
  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly field = this.data.selectedField;

  private readonly water = computed(() => this.state().data?.water.points ?? []);
  private readonly power = computed(() => this.state().data?.power.points ?? []);
  private readonly nutrients = computed(() => this.state().data?.nutrients.points ?? []);

  protected readonly kpi = computed(() => {
    const w = this.water();
    const p = this.power();
    const alerts = this.state().data?.alerts ?? [];
    if (!w.length || !p.length) return null;
    const moisture = w.map((x) => x.soilMoisture);
    const litres = sum(w.slice(-24).map((x) => (x.isPumpOn ? x.flowRate * 60 : 0)));
    const prevLitres = sum(w.slice(-48, -24).map((x) => (x.isPumpOn ? x.flowRate * 60 : 0)));
    return {
      moisture: moisture[moisture.length - 1],
      moistureDelta: delta24h(moisture),
      water: round(litres / 1000, 1),
      waterDelta: prevLitres ? round(((litres - prevLitres) / prevLitres) * 100, 1) : null,
      battery: p[p.length - 1].battery,
      openAlerts: alerts.filter((a) => !a.acknowledged).length,
      critical: alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length,
    };
  });

  protected readonly gauges = computed(() => {
    const n = this.nutrients();
    const w = this.water();
    const p = this.power();
    if (!n.length || !w.length || !p.length) return null;
    return {
      ph: n[n.length - 1].phLevel,
      humidity: w[w.length - 1].humidity,
      ec: p[p.length - 1].conductivity,
    };
  });

  protected readonly trend = computed(() => {
    const w = this.water();
    return chartData(
      this.theme,
      w.map((x) => fmtDayHour(x.ts)),
      [
        { label: 'Soil moisture (%)', data: w.map((x) => x.soilMoisture), color: '--chart-1', fill: true },
        { label: 'Air humidity (%)', data: w.map((x) => x.humidity), color: '--chart-2' },
      ]
    );
  });
  protected readonly trendOptions = computed(() => chartOptions(this.theme, 2, { unit: '%', min: 0, max: 100 }));

  protected readonly avgMoisture7d = computed(() => round(avg(this.water().map((x) => x.soilMoisture)), 1));

  protected readonly recentAlerts = computed(() =>
    [...(this.state().data?.alerts ?? [])].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)).slice(0, 5)
  );

  protected readonly rel = fmtRelative;
  protected readonly full = fmtFull;
  protected readonly phLabel = (v: number) => v.toFixed(2);
}
