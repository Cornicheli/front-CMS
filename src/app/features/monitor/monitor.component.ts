import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ContentService } from '@features/contents/services/content.service';
import { ZONES, getZoneForContent, getMetrics } from '@models/zone.model';
import { MonitorSidebarComponent } from './monitor-sidebar/monitor-sidebar.component';
import { MonitorMapComponent } from './monitor-map/monitor-map.component';
import { MonitorGridComponent } from './monitor-grid/monitor-grid.component';
import { MonitorScreenService } from './monitor-screen.service';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [MonitorSidebarComponent, MonitorMapComponent, MonitorGridComponent, RouterLink],
  templateUrl: './monitor.component.html',
})
export class MonitorComponent {
  protected readonly contentService = inject(ContentService);
  private readonly screenService = inject(MonitorScreenService);

  readonly zones = ZONES;

  readonly activeZoneId   = signal<string | null>(null);
  readonly activeFolderId = signal<number | null>(null);
  readonly viewMode       = signal<'grid' | 'list'>('grid');

  /** Contents shown in the grid: non-archived + zone/folder filters */
  readonly filteredContents = computed(() => {
    let items = this.contentService.contents().filter(c => !c.archived);

    const zoneId = this.activeZoneId();
    if (zoneId) {
      items = items.filter(c => getZoneForContent(c.id) === zoneId);
    }

    const folderId = this.activeFolderId();
    if (folderId) {
      items = items.filter(c => c.folder_id === folderId);
    }

    return items;
  });

  readonly kpiNetworkHealth = computed(() => `${this.screenService.networkHealth()}%`);

  readonly breadcrumb = computed(() => {
    const zoneId = this.activeZoneId();
    const folderId = this.activeFolderId();
    if (zoneId) {
      const zone = this.zones.find(z => z.id === zoneId);
      return zone ? `/ ${zone.name}` : '';
    }
    if (folderId) {
      const folder = this.contentService.folders().find(f => f.id === folderId);
      return folder ? `/ ${folder.name}` : '';
    }
    return '/ Todas las zonas';
  });

  /** Global active plays — total non-archived across the whole network */
  readonly kpiActivePlays = computed(() =>
    this.contentService.contents().filter(c => !c.archived).length
  );

  /** Revenue scoped to current filter view */
  readonly kpiRevenue = computed(() => {
    const total = this.filteredContents().reduce(
      (acc, c) => acc + getMetrics(c.id).revenue, 0
    );
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total}`;
  });

  /** Reach scoped to current filter view */
  readonly kpiReach = computed(() => {
    const total = this.filteredContents().reduce(
      (acc, c) => acc + getMetrics(c.id).reach, 0
    );
    return total >= 1000 ? `${Math.round(total / 1000)}K` : `${total}`;
  });

  constructor() {
    if (this.contentService.contents().length === 0) {
      this.contentService.loadMockData().pipe(takeUntilDestroyed()).subscribe();
    }
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
}
