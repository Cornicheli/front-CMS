import { Component, inject, input, output, computed } from '@angular/core';
import { Zone, getZoneForContent } from '@models/zone.model';
import { Content } from '@models/content.model';
import { MonitorScreenService, ScreenStatus } from '../monitor-screen.service';

@Component({
  selector: 'app-monitor-map',
  standalone: true,
  imports: [],
  templateUrl: './monitor-map.component.html',
})
export class MonitorMapComponent {
  private readonly screenService = inject(MonitorScreenService);

  readonly zones       = input.required<Zone[]>();
  readonly activeZoneId = input<string | null>(null);
  readonly contents    = input<Content[]>([]);

  readonly zoneClicked = output<string | null>();

  /** Count of active (non-archived) contents per zone */
  readonly zoneCountMap = computed(() => {
    const map = new Map<string, number>();
    for (const c of this.contents()) {
      if (!c.archived) {
        const zoneId = getZoneForContent(c.id);
        map.set(zoneId, (map.get(zoneId) ?? 0) + 1);
      }
    }
    return map;
  });

  getCount(zoneId: string): number {
    return this.zoneCountMap().get(zoneId) ?? 0;
  }

  onPinClick(zoneId: string): void {
    // Toggle: click active zone again to deselect
    this.zoneClicked.emit(this.activeZoneId() === zoneId ? null : zoneId);
  }

  readonly totalScreens = computed(() =>
    this.zones().reduce((acc, z) => acc + z.screenCount, 0)
  );

  getPinColor(zoneId: string): string {
    const status = this.screenService.worstZoneStatus(zoneId);
    if (status === 'disconnected') return '#ef4444';
    if (status === 'idle') return '#f59e0b';
    // find zone color for live
    const zone = this.zones().find(z => z.id === zoneId);
    return zone?.color ?? '#4f6ef7';
  }

  isZoneCritical(zoneId: string): boolean {
    return this.screenService.worstZoneStatus(zoneId) === 'disconnected';
  }
}
