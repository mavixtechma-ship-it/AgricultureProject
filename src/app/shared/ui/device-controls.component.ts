import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { DataService } from '../../core/data/data.service';
import { Device, DeviceKind } from '../../core/data/models';
import { fmtRelative } from '../util/format';
import { errorMessage, fieldResource } from '../util/loadable';
import { PanelComponent } from './panel.component';

/** Remote device switches for the selected field. Writes require the admin role (viewer sees disabled switches). */
@Component({
  selector: 'app-device-controls',
  imports: [PanelComponent, ToggleSwitchModule, FormsModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-panel
      [title]="title()"
      [subtitle]="canWrite() ? 'Changes apply immediately' : 'Read-only — sign in as admin to control devices'"
      [status]="state().status === 'ok' && !devices().length ? 'empty' : state().status"
      [error]="state().error"
      skeletonHeight="96px"
      emptyText="No controllable devices on this field."
      (retry)="refresh.set(refresh() + 1)"
    >
      @if (!canWrite()) {
        <span panel-actions class="inline-flex items-center gap-1.5 text-xs font-medium muted">
          <i class="pi pi-lock" aria-hidden="true"></i> View only
        </span>
      }
      <ul class="flex flex-col gap-2.5 list-none m-0 p-0">
        @for (d of devices(); track d.id + ":" + version()) {
          <li class="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <span
              class="grid place-items-center w-10 h-10 rounded-full shrink-0"
              [class]="d.on ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--surface)] muted'"
            >
              <i class="pi" [class]="d.kind === 'pump' ? 'pi-sync' : 'pi-sparkles'" aria-hidden="true"></i>
            </span>
            <div class="min-w-0 flex-1">
              <p class="m-0 text-sm font-semibold truncate">{{ d.kind === 'pump' ? 'Irrigation pump' : 'Fertilizer doser' }}</p>
              <p class="m-0 text-xs muted">
                <span class="font-medium" [class]="d.on ? 'text-[var(--ok)]' : ''">{{ d.on ? 'Running' : 'Stopped' }}</span>
                · {{ d.id }}
                @if (d.updatedAt) {
                  · changed {{ rel(d.updatedAt) }} by {{ d.updatedBy }}
                }
              </p>
            </div>
            <span [pTooltip]="canWrite() ? '' : 'Viewer accounts cannot change devices'" tooltipPosition="left">
              <p-toggleswitch
                [ngModel]="d.on"
                [disabled]="!canWrite() || pending() === d.id"
                [ariaLabel]="(d.on ? 'Stop ' : 'Start ') + d.name"
                (onChange)="toggle(d, $event.checked)"
              />
            </span>
          </li>
        }
      </ul>
    </app-panel>
  `,
})
export class DeviceControlsComponent {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(MessageService);

  readonly kind = input<DeviceKind | null>(null);
  readonly title = input('Device control');

  protected readonly canWrite = this.auth.canWrite;
  protected readonly refresh = signal(0);
  protected readonly pending = signal<string | null>(null);
  /** Bumped after a failed write so the switch re-renders with the server state. */
  protected readonly version = signal(0);
  private readonly overrides = signal<Record<string, Device>>({});
  protected readonly state = fieldResource((id) => this.data.devices(id), this.refresh);

  protected readonly devices = computed(() => {
    const list = this.state().data ?? [];
    const o = this.overrides();
    const k = this.kind();
    return list.filter((d) => !k || d.kind === k).map((d) => o[d.id] ?? d);
  });

  protected rel = fmtRelative;

  protected toggle(d: Device, on: boolean): void {
    if (!this.canWrite()) return;
    this.pending.set(d.id);
    this.data.setDevice(d.id, on).subscribe({
      next: (updated) => {
        this.overrides.update((o) => ({ ...o, [updated.id]: updated }));
        this.pending.set(null);
        this.toast.add({
          severity: 'success',
          summary: on ? 'Device started' : 'Device stopped',
          detail: `${updated.name} is now ${on ? 'running' : 'stopped'}.`,
          life: 3000,
        });
      },
      error: (e) => {
        this.version.update((v) => v + 1);
        this.pending.set(null);
        this.toast.add({ severity: 'error', summary: 'Action not applied', detail: errorMessage(e), life: 4000 });
      },
    });
  }
}
