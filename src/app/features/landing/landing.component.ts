import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../core/theme/theme.service';
import { LogoComponent } from '../../shared/ui/logo.component';
import { MavixCreditComponent } from '../../shared/ui/mavix-credit.component';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, ButtonModule, AccordionModule, LogoComponent, MavixCreditComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly links = [
    { fragment: 'platform', label: 'Platform' },
    { fragment: 'how', label: 'How it works' },
    { fragment: 'sensors', label: 'Sensors' },
    { fragment: 'faq', label: 'FAQ' },
  ];

  protected readonly stats = [
    { value: '18', label: 'metrics tracked per field' },
    { value: '60 min', label: 'reading cadence, 7-day history' },
    { value: '3', label: 'sensor families in one view' },
    { value: '2', label: 'roles: admin and viewer' },
  ];

  protected readonly steps = [
    { icon: 'pi-map-marker', title: 'Place the probes', text: 'Soil, weather and power probes go in once per field and report through a solar gateway.' },
    { icon: 'pi-wifi', title: 'Stream every hour', text: 'Readings arrive hourly and are stored as a rolling seven-day history per field.' },
    { icon: 'pi-bell', title: 'Catch the drift', text: 'Moisture, pH, battery and temperature thresholds raise alerts before crops feel it.' },
    { icon: 'pi-sliders-h', title: 'Act remotely', text: 'Admins start or stop pumps and dosers from the console; viewers follow along read-only.' },
  ];

  protected readonly families = [
    {
      name: 'Irrigation',
      icon: 'pi-cloud',
      metrics: ['Soil moisture (% VWC)', 'Flow rate (L/min)', 'Rainfall (mm)', 'Air temperature (°C)', 'Air humidity (%)', 'Pump state'],
    },
    {
      name: 'Energy & climate',
      icon: 'pi-bolt',
      metrics: ['Battery (%)', 'Irradiance (W/m²)', 'Enclosure temperature (°C)', 'Soil conductivity (µS/cm)'],
    },
    {
      name: 'Nutrients',
      icon: 'pi-sparkles',
      metrics: ['Soil pH', 'Moisture at 30 cm (%)', 'Canopy humidity (%)', 'Doser state'],
    },
  ];

  protected readonly faqs = [
    {
      q: 'Is this connected to real farms?',
      a: 'No. AgriSense is a portfolio demo. Every reading is generated mock data served from inside the browser, and device switches only change in-memory state.',
    },
    {
      q: 'Who can switch pumps and dosers?',
      a: 'Only the admin role. Viewer accounts see the same dashboards and alerts, but every control is disabled and write requests are refused.',
    },
    {
      q: 'How do I get an account?',
      a: 'There is no self-registration. Accounts are issued centrally by the farm administrator.',
    },
    {
      q: 'Does it work in the dark?',
      a: 'Yes — the console has a deep-slate dark mode that follows your system setting and can be toggled at any time.',
    },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
}
