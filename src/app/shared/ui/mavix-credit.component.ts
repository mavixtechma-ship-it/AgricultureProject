import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { OWNER } from '../../core/owner';
import { ThemeService } from '../../core/theme/theme.service';

/**
 * "Built by Mavix Tech" credit, in three layouts:
 *  - `card`   under the login form
 *  - `strip`  in the landing-page footer
 *  - `badge`  compact "Powered by" link at the bottom of the (always dark) dashboard sidebar
 * The Mavix palette is scoped to this component so AgriSense keeps its own theme.
 */
@Component({
  selector: 'app-mavix-credit',
  imports: [TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant()) {
      @case ('badge') {
        <a class="mx-badge" [href]="owner.url" target="_blank" rel="noopener noreferrer" [pTooltip]="owner.tagline" tooltipPosition="top" [attr.aria-label]="'Powered by ' + owner.name + ' (opens in a new tab)'">
          <img [src]="owner.markDark" alt="" width="22" height="22" />
          <span class="min-w-0 truncate">Powered by <b>{{ owner.name }}</b></span>
          <i class="pi pi-external-link text-[10px] opacity-70" aria-hidden="true"></i>
        </a>
      }
      @case ('strip') {
        <div class="mx-strip flex flex-col gap-4 sm:flex-row sm:items-center">
          <a [href]="owner.url" target="_blank" rel="noopener noreferrer" class="shrink-0" [attr.aria-label]="owner.name + ' website (opens in a new tab)'">
            <img [src]="onDark() ? owner.logoDark : owner.logo" [alt]="owner.name" width="98" height="32" class="block h-8 w-auto" />
          </a>
          <div class="min-w-0">
            <p class="m-0 text-sm font-semibold text-[var(--text)]">Developed by {{ owner.name }}</p>
            <p class="m-0 text-xs muted">{{ owner.tagline }}</p>
          </div>
          <a class="mx-link sm:ms-auto" [href]="owner.url" target="_blank" rel="noopener noreferrer">
            Visit website <i class="pi pi-external-link text-[10px]" aria-hidden="true"></i>
          </a>
        </div>
      }
      @default {
        <div class="mx-card flex flex-col items-center gap-2 text-center">
          <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] muted">Built by {{ owner.name }}</p>
          <a [href]="owner.url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="owner.name + ' website (opens in a new tab)'">
            <img [src]="onDark() ? owner.logoDark : owner.logo" [alt]="owner.name" width="110" height="36" class="block h-9 w-auto" />
          </a>
          <p class="m-0 text-xs muted">{{ owner.tagline }}</p>
          <a class="mx-link" [href]="owner.url" target="_blank" rel="noopener noreferrer">
            mavixtechma-ship-it.github.io/Mavix <i class="pi pi-external-link text-[10px]" aria-hidden="true"></i>
          </a>
        </div>
      }
    }
  `,
  styles: `
    .mx-card,
    .mx-strip {
      padding: 16px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, #1e5eff 22%, var(--border));
      background: linear-gradient(135deg, color-mix(in srgb, #1e5eff 7%, transparent), color-mix(in srgb, #38bdf8 5%, transparent));
    }
    .mx-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #1e5eff;
      text-decoration: none;
    }
    .mx-link:hover { text-decoration: underline; }
    :host-context(.app-dark) .mx-link { color: #38bdf8; }
    .mx-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid #1f2b44;
      background: linear-gradient(135deg, rgb(30 94 255 / 0.14), rgb(56 189 248 / 0.08));
      color: #9fb3d1;
      font-size: 12px;
      text-decoration: none;
      transition: border-color 0.15s, color 0.15s;
    }
    .mx-badge b { color: #fff; font-weight: 600; }
    .mx-badge:hover { border-color: #38bdf8; color: #fff; }
  `,
})
export class MavixCreditComponent {
  private readonly theme = inject(ThemeService);
  protected readonly owner = OWNER;

  readonly variant = input<'card' | 'strip' | 'badge'>('card');

  /** Pick the white wordmark on dark surfaces (follows the light/dark theme). */
  protected readonly onDark = computed(() => this.theme.dark());
}
