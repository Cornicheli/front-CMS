import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '@features/contents/services/content.service';
import { ZONES, getZoneForContent, getMetrics } from '@models/zone.model';
import { MonitorMapComponent } from './monitor-map/monitor-map.component';
import { MonitorGridComponent } from './monitor-grid/monitor-grid.component';
import { MonitorScreenService } from './monitor-screen.service';
import { ThemeService } from '@core/services/theme.service';
import { AppSidebarComponent } from '@shared/app-sidebar/app-sidebar.component';
import { AppRightRailComponent } from '@shared/app-right-rail/app-right-rail.component';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [MonitorMapComponent, MonitorGridComponent, AppSidebarComponent, AppRightRailComponent],
  templateUrl: './monitor.component.html',
})
export class MonitorComponent {
  protected readonly contentService = inject(ContentService);
  protected readonly screenService = inject(MonitorScreenService);
  protected readonly themeService = inject(ThemeService);

  readonly zones = ZONES;
  readonly activeZoneId = signal<string | null>(null);
  readonly activeFolderId = signal<number | null>(null);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly filteredContents = computed(() => {
    let items = this.contentService.contents().filter((c) => !c.archived);
    const zoneId = this.activeZoneId();
    if (zoneId) items = items.filter((c) => getZoneForContent(c.id) === zoneId);
    const folderId = this.activeFolderId();
    if (folderId) items = items.filter((c) => c.folder_id === folderId);
    return items;
  });

  readonly kpiNetworkHealth = computed(() => `${this.screenService.networkHealth()}%`);

  readonly breadcrumb = computed(() => {
    const zoneId = this.activeZoneId();
    const folderId = this.activeFolderId();
    if (zoneId) {
      const zone = this.zones.find((z) => z.id === zoneId);
      return zone ? `/ ${zone.name}` : '';
    }
    if (folderId) {
      const folder = this.contentService.folders().find((f) => f.id === folderId);
      return folder ? `/ ${folder.name}` : '';
    }
    return '/ Todas las zonas';
  });

  readonly kpiActivePlays = computed(
    () =>
      this.contentService
        .contents()
        .filter((c) => !c.archived && !this.screenService.isContentOffline(c.id)).length,
  );

  readonly kpiRevenue = computed(() => {
    const total = this.filteredContents()
      .filter((c) => !this.screenService.isContentOffline(c.id))
      .reduce((acc, c) => acc + getMetrics(c.id).revenue, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total}`;
  });

  readonly kpiErrors = computed(() => this.screenService.alertCount());

  readonly timeline24h = computed(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const plays = hours.map(
      (h) => 30 + Math.round(Math.sin((h / 24) * Math.PI * 2 - 1) * 20 + ((h * 7) % 9)),
    );
    const max = Math.max(...plays);
    const now = new Date().getHours();
    return hours.map((h) => ({
      h,
      pct: (plays[h] / max) * 68,
      trigPct: (h * 3) % 7 > 4 ? (plays[h] / max) * 28 : 0,
      isNow: h === now,
    }));
  });

  readonly liveTime = signal(new Date().toTimeString().slice(0, 8));

  constructor() {
    if (this.contentService.contents().length === 0) {
      this.contentService.loadMockData().pipe(takeUntilDestroyed()).subscribe();
    }
    setInterval(() => this.liveTime.set(new Date().toTimeString().slice(0, 8)), 1000);
  }

  onZoneSelected(id: string | null): void {
    this.activeZoneId.set(id);
    this.activeFolderId.set(null);
  }

  onFolderSelected(id: number | null): void {
    this.activeFolderId.set(id);
    this.activeZoneId.set(null);
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  activeZoneName(): string {
    const id = this.activeZoneId();
    if (!id) return '';
    return this.zones.find((z) => z.id === id)?.name ?? '';
  }
}
