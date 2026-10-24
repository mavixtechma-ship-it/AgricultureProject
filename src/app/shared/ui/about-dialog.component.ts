import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { OWNER } from '../../core/owner';
import { ThemeService } from '../../core/theme/theme.service';
import { LogoComponent } from './logo.component';

/** About AgriSense + the developer (Mavix Tech). Opened from the dashboard account menu. */
@Component({
  selector: 'app-about-dialog',
  imports: [DialogModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      header="About"
      styleClass="w-[min(440px,calc(100vw-32px))]"
      appendTo="body"
    >
      <div class="flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <app-logo [size]="40" />
        </div>
        <p class="m-0 text-sm muted">
          Smart-farm sensor dashboard. <b class="text-[var(--text)]">Demo system</b> — all farms, devices and readings are simulated.
        </p>

        <div class="mx-about flex flex-col gap-3">
          <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] muted">Developed by</p>
          <img [src]="dark() ? owner.logoDark : owner.logo" [alt]="owner.name" width="122" height="40" class="block h-10 w-auto self-start" />
          <p class="m-0 text-sm font-semibold mx-tagline" [class.is-dark]="dark()">{{ owner.tagline }}</p>
          <p class="m-0 text-sm muted">{{ owner.description }}</p>
          <p class="m-0 text-sm font-semibold text-[var(--text)]">{{ owner.cta }}</p>
          <a class="mx-btn" [href]="owner.url" target="_blank" rel="noopener noreferrer">
            Visit website <i class="pi pi-external-link text-xs" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </p-dialog>
  `,
  styles: `
    .mx-about {
      padding: 16px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, #1e5eff 22%, var(--border));
      background: linear-gradient(135deg, color-mix(in srgb, #1e5eff 7%, transparent), color-mix(in srgb, #38bdf8 5%, transparent));
    }
    .mx-tagline { color: #1e5eff; }
    /* The dialog is appended to <body>, so :host-context() would not match: toggle a class instead. */
    .mx-tagline.is-dark { color: #38bdf8; }
    .mx-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      align-self: flex-start;
      padding: 9px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, #1e5eff, #38bdf8);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    .mx-btn:hover { filter: brightness(1.08); }
  `,
})
export class AboutDialogComponent {
  private readonly theme = inject(ThemeService);
  protected readonly owner = OWNER;
  protected readonly dark = computed(() => this.theme.dark());

  readonly visible = model(false);
}
