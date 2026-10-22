import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/** KPI tile: muted label, large tabular value + unit, optional 24h delta (arrow + text, never colour-only). */
@Component({
  selector: 'app-kpi-tile',
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel h-full p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[13px] font-medium muted">{{ label() }}</span>
        @if (icon()) {
          <span
            class="grid place-items-center w-9 h-9 rounded-xl"
            [class]="tone() === 'amber' ? 'bg-[var(--amber-soft)] text-[var(--amber)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'"
          >
            <i [class]="'pi ' + icon()" aria-hidden="true"></i>
          </span>
        }
      </div>
      @if (loading()) {
        <p-skeleton width="60%" height="2rem" />
        <p-skeleton width="40%" height="0.9rem" />
      } @else {
        <div class="flex items-baseline gap-1.5" [title]="label() + ': ' + (value() ?? '—') + ' ' + unit()">
          <span class="num text-[28px] font-[680] leading-none tracking-tight">{{ value() ?? '—' }}</span>
          <span class="text-sm muted">{{ unit() }}</span>
        </div>
        <div class="text-xs min-h-[18px] flex items-center gap-1.5">
          @if (delta() !== null) {
            <span class="inline-flex items-center gap-1 font-semibold num" [class]="deltaClass()">
              <i class="pi text-[10px]" [class]="(delta() ?? 0) >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'" aria-hidden="true"></i>
              {{ (delta() ?? 0) >= 0 ? '+' : '' }}{{ delta() }}%
            </span>
            <span class="muted">vs previous 24 h</span>
          } @else if (hint()) {
            <span class="muted">{{ hint() }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class KpiTileComponent {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly unit = input('');
  readonly icon = input<string>('');
  readonly tone = input<'accent' | 'amber'>('accent');
  readonly delta = input<number | null>(null);
  /** When true, a rising value is bad (e.g. enclosure temperature). */
  readonly invertDelta = input(false);
  readonly hint = input<string>('');
  readonly loading = input(false);

  protected readonly deltaClass = computed(() => {
    const d = this.delta() ?? 0;
    const good = this.invertDelta() ? d <= 0 : d >= 0;
    return good ? 'text-[var(--ok)]' : 'text-[var(--err)]';
  });
}
