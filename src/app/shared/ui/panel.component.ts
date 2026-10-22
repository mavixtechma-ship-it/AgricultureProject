import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * Section container used by every dashboard widget. Handles loading (skeleton), error (message + retry)
 * and empty states so pages only compose content.
 */
@Component({
  selector: 'app-panel',
  imports: [SkeletonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="panel h-full flex flex-col" [attr.aria-label]="title()">
      <header class="panel-head">
        <div class="min-w-0">
          <h2 class="panel-title truncate">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="panel-sub">{{ subtitle() }}</p>
          }
        </div>
        <div class="flex items-center gap-2 shrink-0"><ng-content select="[panel-actions]" /></div>
      </header>
      <div class="flex-1 min-h-0" [class]="flush() ? 'pt-3' : 'p-5 pt-4'">
        @switch (status()) {
          @case ('loading') {
            <div class="flex flex-col gap-3" [class.px-5]="flush()" [class.pb-5]="flush()">
              <p-skeleton height="1.1rem" width="45%" />
              <p-skeleton [height]="skeletonHeight()" />
            </div>
          }
          @case ('error') {
            <div class="flex flex-col items-start gap-3 rounded-xl bg-[var(--err-soft)] p-4 text-sm" role="alert" [class.mx-5]="flush()" [class.mb-5]="flush()">
              <span class="inline-flex items-center gap-2 font-medium text-[var(--err)]">
                <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ error() ?? 'Could not load data.' }}
              </span>
              <p-button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" [outlined]="true" (onClick)="retry.emit()" />
            </div>
          }
          @case ('empty') {
            <div class="flex flex-col items-center justify-center gap-2 py-10 text-center muted">
              <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
              <span class="text-sm">{{ emptyText() }}</span>
            </div>
          }
          @default {
            <ng-content />
          }
        }
      </div>
    </section>
  `,
})
export class PanelComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly status = input<'loading' | 'ok' | 'error' | 'empty'>('ok');
  readonly error = input<string | null>(null);
  readonly emptyText = input('Nothing to show yet.');
  readonly skeletonHeight = input('220px');
  /** Removes inner padding (for tables/lists that run edge to edge). */
  readonly flush = input(false);
  readonly retry = output<void>();
}
