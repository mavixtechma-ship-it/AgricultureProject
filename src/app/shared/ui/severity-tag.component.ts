import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { AlertSeverity } from '../../core/data/models';

const MAP: Record<AlertSeverity, { severity: 'danger' | 'warn' | 'info'; icon: string; label: string }> = {
  critical: { severity: 'danger', icon: 'pi pi-times-circle', label: 'Critical' },
  warning: { severity: 'warn', icon: 'pi pi-exclamation-triangle', label: 'Warning' },
  info: { severity: 'info', icon: 'pi pi-info-circle', label: 'Info' },
};

/** Severity badge: icon + text + colour (status is never conveyed by colour alone). */
@Component({
  selector: 'app-severity-tag',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [severity]="cfg().severity" [icon]="cfg().icon" [value]="cfg().label" [rounded]="true" />`,
})
export class SeverityTagComponent {
  readonly severity = input.required<AlertSeverity>();
  protected readonly cfg = computed(() => MAP[this.severity()]);
}
