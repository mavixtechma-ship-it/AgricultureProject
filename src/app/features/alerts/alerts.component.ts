import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DataService } from '../../core/data/data.service';
import { AlertSeverity, FarmAlert } from '../../core/data/models';
import { fmtFull, fmtRelative } from '../../shared/util/format';
import { Loadable, errorMessage, toLoadable } from '../../shared/util/loadable';
import { PanelComponent } from '../../shared/ui/panel.component';
import { SeverityTagComponent } from '../../shared/ui/severity-tag.component';

type Scope = 'field' | 'all';
type StatusFilter = 'open' | 'all';

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

@Component({
  selector: 'app-alerts',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    PanelComponent,
    SeverityTagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts.component.html',
})
export class AlertsComponent {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(MessageService);

  protected readonly canWrite = this.auth.canWrite;
  protected readonly scope = signal<Scope>('all');
  protected readonly status = signal<StatusFilter>('open');
  protected readonly severity = signal<AlertSeverity | null>(null);
  protected readonly query = signal('');
  protected readonly refresh = signal(0);
  protected readonly busy = signal<string | null>(null);
  private readonly acked = signal<Record<string, FarmAlert>>({});

  protected readonly scopeOptions = [
    { label: 'All fields', value: 'all' },
    { label: 'Selected field', value: 'field' },
  ];
  protected readonly statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'All', value: 'all' },
  ];
  protected readonly severityOptions = [
    { label: 'Critical', value: 'critical' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' },
  ];

  private readonly key = computed(() => ({ scope: this.scope(), field: this.data.selectedFieldId(), r: this.refresh() }));
  protected readonly state = toSignal(
    toObservable(this.key).pipe(switchMap((k) => toLoadable(this.data.alerts(k.scope === 'field' ? k.field || undefined : undefined)))),
    { initialValue: { status: 'loading', data: null, error: null } as Loadable<FarmAlert[]> }
  );

  protected readonly rows = computed(() => {
    const overrides = this.acked();
    const q = this.query().trim().toLowerCase();
    const sev = this.severity();
    return (this.state().data ?? [])
      .map((a) => overrides[a.id] ?? a)
      .filter((a) => (this.status() === 'open' ? !a.acknowledged : true))
      .filter((a) => (sev ? a.severity === sev : true))
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || this.fieldName(a.fieldId).toLowerCase().includes(q))
      .map((a) => ({ ...a, rank: SEVERITY_RANK[a.severity], field: this.fieldName(a.fieldId) }))
      .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
  });

  protected readonly summary = computed(() => {
    const all = (this.state().data ?? []).map((a) => this.acked()[a.id] ?? a).filter((a) => !a.acknowledged);
    return {
      critical: all.filter((a) => a.severity === 'critical').length,
      warning: all.filter((a) => a.severity === 'warning').length,
      info: all.filter((a) => a.severity === 'info').length,
    };
  });

  protected fieldName(id: string): string {
    return this.data.fieldName(id);
  }

  protected readonly rel = fmtRelative;
  protected readonly full = fmtFull;

  protected acknowledge(a: FarmAlert): void {
    if (!this.canWrite()) return;
    this.busy.set(a.id);
    this.data.acknowledgeAlert(a.id).subscribe({
      next: (updated) => {
        this.acked.update((o) => ({ ...o, [updated.id]: updated }));
        this.data.openAlerts.update((n) => Math.max(0, n - 1));
        this.busy.set(null);
        this.toast.add({ severity: 'success', summary: 'Alert acknowledged', detail: updated.title, life: 3000 });
      },
      error: (e) => {
        this.busy.set(null);
        this.toast.add({ severity: 'error', summary: 'Not acknowledged', detail: errorMessage(e), life: 4000 });
      },
    });
  }
}
