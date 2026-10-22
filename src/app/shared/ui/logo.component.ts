import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** AgriSense mark: a sprout rising from a sensor signal arc, on a deep-teal tile. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2.5 select-none">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect width="48" height="48" rx="13" fill="#0b645e" />
        <path d="M24 37V21" stroke="#e6fffb" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M24 27c-7.5 0-12-5-12-12.5 7.5 0 12 4.6 12 12.5z" fill="#53f5dc" />
        <path d="M24 22.5c0-7 4.4-12 12-12 0 7.4-4.6 12-12 12z" fill="#e6fffb" />
        <path d="M13.5 39a10.5 10.5 0 0 1 21 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none" />
      </svg>
      @if (wordmark()) {
        <span class="text-[19px] font-[720] tracking-tight leading-none" [class.text-white]="inverse()">
          Agri<span [class]="inverse() ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400'">Sense</span>
        </span>
      }
    </span>
  `,
})
export class LogoComponent {
  readonly size = input(34);
  readonly wordmark = input(true);
  readonly inverse = input(false);
}
