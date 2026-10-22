import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/auth/auth.service';
import { safeReturnUrl } from '../../core/auth/auth.guard';
import { ThemeService } from '../../core/theme/theme.service';
import { LogoComponent } from '../../shared/ui/logo.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  /** Bound from the query string by withComponentInputBinding(); validated before use. */
  readonly returnUrl = input<string | undefined>(undefined);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(32), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Enter your username and password.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    try {
      const result = await this.auth.login(username, password);
      if (result.ok) {
        this.form.reset();
        await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()), { replaceUrl: true });
        return;
      }
      this.form.controls.password.reset();
      this.error.set(
        result.reason === 'locked'
          ? `Too many attempts. Try again in ${result.retryInSec ?? 30} seconds.`
          : result.reason === 'unsupported'
            ? 'This browser cannot verify passwords here (a secure context — HTTPS or localhost — is required).'
            : 'Username or password is incorrect.'
      );
    } finally {
      this.busy.set(false);
    }
  }
}
