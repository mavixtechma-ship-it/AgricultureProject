import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { DataService } from '../core/data/data.service';
import { ThemeService } from '../core/theme/theme.service';
import { AboutDialogComponent } from '../shared/ui/about-dialog.component';
import { LogoComponent } from '../shared/ui/logo.component';
import { MavixCreditComponent } from '../shared/ui/mavix-credit.component';
import { NgTemplateOutlet } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    NgTemplateOutlet,
    ButtonModule,
    DrawerModule,
    SelectModule,
    ToastModule,
    TooltipModule,
    BadgeModule,
    LogoComponent,
    MavixCreditComponent,
    AboutDialogComponent,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly data = inject(DataService);
  protected readonly theme = inject(ThemeService);

  protected readonly mobileNav = signal(false);
  protected readonly aboutOpen = signal(false);
  protected readonly farmsError = signal(false);
  protected readonly now = signal(new Date());

  protected readonly nav: NavItem[] = [
    { path: '/app', label: 'Overview', icon: 'pi-objects-column', exact: true },
    { path: '/app/irrigation', label: 'Irrigation', icon: 'pi-cloud' },
    { path: '/app/energy', label: 'Energy & climate', icon: 'pi-bolt' },
    { path: '/app/nutrients', label: 'Nutrients', icon: 'pi-sparkles' },
    { path: '/app/alerts', label: 'Alerts', icon: 'pi-bell' },
  ];

  protected readonly heading = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let s = this.router.routerState.snapshot.root;
        while (s.firstChild) s = s.firstChild;
        return (s.data?.['heading'] as string | undefined) ?? 'Overview';
      })
    ),
    { initialValue: 'Overview' }
  );

  protected readonly fieldGroups = computed(() =>
    this.data.farms().map((farm) => ({
      label: farm.name,
      items: farm.fields.map((f) => ({ label: `${f.name} · ${f.crop}`, value: f.id })),
    }))
  );

  protected readonly initials = computed(() => (this.auth.session()?.username ?? '?').slice(0, 2).toUpperCase());
  protected readonly lastUpdated = computed(() =>
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(this.now())
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.loadFarms();
    this.data
      .alerts()
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({ next: (a) => this.data.openAlerts.set(a.filter((x) => !x.acknowledged).length), error: () => {} });
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe(() => {
        this.mobileNav.set(false);
        this.now.set(new Date());
      });
  }

  protected loadFarms(): void {
    this.farmsError.set(false);
    this.data.loadFarms().subscribe({ error: () => this.farmsError.set(true) });
  }

  protected onField(id: string): void {
    this.data.selectField(id);
    this.now.set(new Date());
  }

  protected signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
