import { Component, inject, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContentService } from '@features/contents/services/content.service';
import { Content } from '@models/content.model';
import { Category } from '@models/category.model';
import { getStatusForContent, getMetrics } from '@models/zone.model';
import { ProofOfPlayModalComponent } from '../proof-of-play-modal/proof-of-play-modal.component';

@Component({
  selector: 'app-monitor-grid',
  standalone: true,
  imports: [DatePipe, ProofOfPlayModalComponent],
  templateUrl: './monitor-grid.component.html',
})
export class MonitorGridComponent {
  private readonly contentService = inject(ContentService);

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

  /* ── Helpers (used in template) ── */
  statusClass(id: number): string {
    const s = getStatusForContent(id);
    if (s === 'live')      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    if (s === 'scheduled') return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
    return 'bg-red-500/15 text-red-400 border border-red-500/20';
  }

  statusLabel(id: number): string {
    const s = getStatusForContent(id);
    if (s === 'live')      return 'Live';
    if (s === 'scheduled') return 'Scheduled';
    return 'Error';
  }

  statusDotClass(id: number): string {
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
    const labels = ['🌦 Clima', '⏰ Hora pico', '📍 Ubicación'];
    return labels[id % 3];
  }
}
