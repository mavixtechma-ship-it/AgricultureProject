import { ThemeService } from '../../core/theme/theme.service';

export interface SeriesSpec {
  label: string;
  data: number[];
  /** CSS token name, e.g. --chart-1 */
  color: string;
  fill?: boolean;
  axis?: 'y' | 'y1';
  type?: 'line' | 'bar';
  stepped?: boolean;
  dashed?: boolean;
}

function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Chart.js data object built from design tokens. */
export function chartData(theme: ThemeService, labels: string[], series: SeriesSpec[]) {
  return {
    labels,
    datasets: series.map((s) => {
      const c = theme.token(s.color) || '#029e91';
      return {
        type: s.type ?? 'line',
        label: s.label,
        data: s.data,
        yAxisID: s.axis ?? 'y',
        borderColor: c,
        backgroundColor: s.type === 'bar' ? alpha(c, 0.75) : alpha(c, 0.12),
        fill: s.fill ?? false,
        stepped: s.stepped ?? false,
        borderDash: s.dashed ? [6, 5] : [],
        tension: 0.35,
        borderWidth: s.dashed ? 1.5 : 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderRadius: s.type === 'bar' ? 6 : 0,
        maxBarThickness: 28,
      };
    }),
  };
}

export interface AxisSpec {
  unit?: string;
  min?: number;
  max?: number;
  y1Unit?: string;
  y1Min?: number;
  y1Max?: number;
  maxTicks?: number;
}

/** Chart.js options themed from tokens (light grid, no borders, legend only with >1 series, unit-aware tooltips). */
export function chartOptions(theme: ThemeService, seriesCount: number, axis: AxisSpec = {}) {
  void theme.dark(); // establishes a signal dependency so callers in computed() re-theme on toggle
  const text = theme.token('--text-muted');
  const grid = theme.token('--chart-grid');
  const tick = { color: text, font: { size: 11 } };
  const scales: Record<string, unknown> = {
    x: { ticks: { ...tick, maxTicksLimit: axis.maxTicks ?? 7, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { display: false } },
    y: {
      min: axis.min,
      max: axis.max,
      ticks: { ...tick, callback: (v: number | string) => `${v}${axis.unit ?? ''}` },
      grid: { color: grid },
      border: { display: false },
    },
  };
  if (axis.y1Unit !== undefined) {
    scales['y1'] = {
      position: 'right',
      min: axis.y1Min,
      max: axis.y1Max,
      ticks: { ...tick, callback: (v: number | string) => `${v}${axis.y1Unit ?? ''}` },
      grid: { display: false },
      border: { display: false },
    };
  }
  return {
    maintainAspectRatio: false,
    responsive: true,
    animation: { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: seriesCount > 1,
        position: 'top',
        align: 'end',
        labels: { color: text, usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6, font: { size: 12 } },
      },
      tooltip: { padding: 10, cornerRadius: 8, boxPadding: 4 },
    },
    scales,
  };
}
