import { Component, signal, computed } from '@angular/core';

export interface PopEvent {
  t: string;
  screen: string;
  zone: string;
  content: string;
  dur: number;
  status: 'ok' | 'partial';
}

export interface SmartTrigger {
  icon: string;
  name: string;
  sub: string;
  color: string;
  on: boolean;
  hits: number;
}

@Component({
  selector: 'app-right-rail',
  standalone: true,
  templateUrl: './app-right-rail.component.html',
  host: { class: 'flex-shrink-0 flex flex-col min-h-0' },
})
export class AppRightRailComponent {
  readonly triggers = signal<SmartTrigger[]>([
    { icon: '☂', name: 'Lluvia',     sub: 'rain > 0.5mm',  color: '#67e8f9', on: true,  hits: 14 },
    { icon: '⏱', name: 'Hora pico', sub: '18:00 — 21:00', color: '#fbbf24', on: true,  hits: 42 },
    { icon: '☀', name: 'Calor',      sub: 'temp > 32°',    color: '#f87171', on: true,  hits: 8  },
    { icon: '⚽', name: 'Match local', sub: 'event.match',  color: '#a78bfa', on: false, hits: 0  },
  ]);

  readonly activeCount = computed(() => this.triggers().filter((t) => t.on).length);

  readonly popActivity: PopEvent[] = [
    { t: '03:31:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'partial' },
    { t: '03:31:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:30:33', screen: 'RET-002',  zone: 'Retiro',    content: 'Campaña Retiro',    dur: 30, status: 'ok' },
    { t: '03:30:05', screen: 'CABA-009', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:29:33', screen: 'PAL-003',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:29:05', screen: 'PM-001',   zone: 'P. Madero', content: 'Coca Cola Mundial', dur: 30, status: 'ok' },
    { t: '03:28:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:28:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Banner Tecno',      dur: 15, status: 'ok' },
    { t: '03:27:33', screen: 'TEL-002',  zone: 'San Telmo', content: 'Menu Digital',      dur: 30, status: 'partial' },
    { t: '03:27:05', screen: 'CABA-009', zone: 'Centro',    content: 'Coca Cola',         dur: 10, status: 'ok' },
    { t: '03:26:33', screen: 'PAL-007',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:26:05', screen: 'RET-002',  zone: 'Retiro',    content: 'Campaña Retiro',    dur: 30, status: 'ok' },
  ];

  toggleTrigger(index: number): void {
    this.triggers.update((list) =>
      list.map((t, i) => (i === index ? { ...t, on: !t.on } : t)),
    );
  }
}
