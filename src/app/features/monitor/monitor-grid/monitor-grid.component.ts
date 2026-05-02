import { Component, inject, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContentService } from '@features/contents/services/content.service';
import { Content } from '@models/content.model';
import { Category } from '@models/category.model';
import { getStatusForContent, getMetrics } from '@models/zone.model';
import { ProofOfPlayModalComponent } from '../proof-of-play-modal/proof-of-play-modal.component';
import { MonitorScreenService } from '../monitor-screen.service';

@Component({
  selector: 'app-monitor-grid',
  standalone: true,
  imports: [DatePipe, ProofOfPlayModalComponent],
  templateUrl: './monitor-grid.component.html',
})
export class MonitorGridComponent {
  private readonly contentService = inject(ContentService);
  readonly screenService = inject(MonitorScreenService);

  readonly contents       = input<Content[]>([]);
  readonly viewMode       = input<'grid' | 'list'>('grid');
  readonly categories     = input<Category[]>([]);
  readonly viewModeChange = output<'grid' | 'list'>();

  readonly selectedIds = signal<Set<number>>(new Set());

  readonly hasSelection   = computed(() => this.selectedIds().size > 0);
  readonly selectionCount = computed(() => this.selectedIds().size);

  readonly categoryMap = computed(() => {
    const map = new Map<number, string>();
    for (const cat of this.categories()) {
      map.set(cat.id, cat.name);
    }
    return map;
  });

  /* ── Selection ── */
  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /* ── Bulk actions ── */
  archiveSelected(): void {
    const ids = [...this.selectedIds()];
    this.contentService.archiveContents(ids).subscribe({
      next: () => this.clearSelection(),
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    let remaining = ids.length;
    ids.forEach(id => {
      this.contentService.deleteContent(id).subscribe({
        next: () => {
          remaining -= 1;
          if (remaining === 0) this.clearSelection();
        },
      });
    });
  }

  readonly detailContent = signal<import('@models/content.model').Content | null>(null);

  openDetail(item: import('@models/content.model').Content, event: MouseEvent): void {
    event.stopPropagation();
    this.detailContent.set(item);
  }

  closeDetail(): void { this.detailContent.set(null); }

  toggleContentStatus(contentId: number): void {
    const current = this.screenService.isContentOffline(contentId) ? 'offline' : 'online';
    const next = current === 'online' ? 'offline' : 'online';
    this.screenService.setContentStatus(contentId, next);
  }

  /* ── Helpers (used in template) ── */
  statusClass(id: number): string {
    if (this.screenService.isContentOffline(id)) return 'bg-red-500/15 text-red-400 border border-red-500/20';
    const s = getStatusForContent(id);
    if (s === 'live')      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    if (s === 'scheduled') return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
    return 'bg-red-500/15 text-red-400 border border-red-500/20';
  }

  statusLabel(id: number): string {
    if (this.screenService.isContentOffline(id)) return 'Disconnected';
    const s = getStatusForContent(id);
    if (s === 'live')      return 'Live';
    if (s === 'scheduled') return 'Scheduled';
    return 'Error';
  }

  statusDotClass(id: number): string {
    if (this.screenService.isContentOffline(id)) return 'bg-red-400';
    const s = getStatusForContent(id);
    if (s === 'live')      return 'bg-emerald-400 animate-pulse';
    if (s === 'scheduled') return 'bg-amber-400';
    return 'bg-red-400';
  }

  categoryName(id: number | null): string {
    if (id === null) return '';
    return this.categoryMap().get(id) ?? '';
  }

  metrics(id: number): { reach: number; revenue: number; ctr: number } {
    return getMetrics(id);
  }

  formatReach(reach: number): string {
    return reach >= 1000 ? `${(reach / 1000).toFixed(1)}K` : `${reach}`;
  }

  readonly popTargetId   = signal<number | null>(null);
  readonly popTargetName = signal<string>('');

  openPoP(id: number, name: string): void {
    this.popTargetId.set(id);
    this.popTargetName.set(name);
  }

  closePoP(): void { this.popTargetId.set(null); }

  showTriggerBadge(id: number): boolean { return id % 3 === 0; }

  triggerLabel(id: number): string {
    const labels = ['Clima', 'Hora pico', 'Ubicación'];
    return labels[id % 3];
  }

  // ── Sparkline helpers ──────────────────────────────────────────
  private genSpark(seed: number): number[] {
    const arr: number[] = [];
    let v = 50 + ((seed * 7) % 30);
    for (let i = 0; i < 16; i++) {
      v += Math.sin(i * 0.6 + seed) * 8 + ((seed * i) % 5) - 2;
      arr.push(Math.max(10, Math.min(90, v)));
    }
    return arr;
  }

  sparklinePts(id: number): string {
    const data = this.genSpark(id);
    const w = 46, h = 15;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    return data.map((v, i) =>
      `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`
    ).join(' ');
  }

  sparklineArea(id: number): string {
    const pts = this.sparklinePts(id);
    return `0,15 ${pts} 46,15`;
  }
}
