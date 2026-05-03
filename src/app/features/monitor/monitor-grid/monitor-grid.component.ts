import { Component, inject, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContentService } from '@features/contents/services/content.service';
import { Content } from '@models/content.model';
import { Category } from '@models/category.model';
import { getStatusForContent, getMetrics } from '@models/zone.model';
import { ProofOfPlayModalComponent } from '../proof-of-play-modal/proof-of-play-modal.component';
import { MonitorScreenService } from '../monitor-screen.service';
import { MediaThumbComponent } from '@shared/media-thumb/media-thumb.component';

@Component({
  selector: 'app-monitor-grid',
  standalone: true,
  imports: [DatePipe, ProofOfPlayModalComponent, MediaThumbComponent],
  templateUrl: './monitor-grid.component.html',
})
export class MonitorGridComponent {
  private readonly contentService = inject(ContentService);
  readonly screenService = inject(MonitorScreenService);

  readonly contents       = input<Content[]>([]);
  readonly viewMode       = input<'grid' | 'list'>('grid');
  readonly categories     = input<Category[]>([]);
  readonly viewModeChange = output<'grid' | 'list'>();

  readonly selectedIds    = signal<Set<number>>(new Set());
  readonly hasSelection   = computed(() => this.selectedIds().size > 0);
  readonly selectionCount = computed(() => this.selectedIds().size);
  readonly detailContent  = signal<Content | null>(null);
  readonly popTargetId    = signal<number | null>(null);
  readonly popTargetName  = signal<string>('');

  readonly categoryMap = computed(() => {
    const map = new Map<number, string>();
    for (const cat of this.categories()) map.set(cat.id, cat.name);
    return map;
  });

  // ── Status helpers ─────────────────────────────────────────────
  private statusTone(id: number): { bg: string; fg: string; border: string; dot: string; glow: boolean } {
    if (this.screenService.isContentOffline(id)) {
      return { bg: 'rgba(248,113,113,0.12)', fg: '#f87171', border: 'rgba(248,113,113,0.30)', dot: '#f87171', glow: false };
    }
    const s = getStatusForContent(id);
    if (s === 'scheduled') {
      return { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24', border: 'rgba(251,191,36,0.30)', dot: '#fbbf24', glow: false };
    }
    return { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80', border: 'rgba(74,222,128,0.30)', dot: '#4ade80', glow: true };
  }

  statusPillStyle(id: number): string {
    const t = this.statusTone(id);
    return `background:${t.bg}; color:${t.fg}; border:1px solid ${t.border}`;
  }

  statusDotStyle(id: number): string {
    const t = this.statusTone(id);
    return `background:${t.dot}${t.glow ? `; box-shadow:0 0 6px ${t.dot}` : ''}`;
  }

  statusLabel(id: number): string {
    if (this.screenService.isContentOffline(id)) return 'Disconnected';
    const s = getStatusForContent(id);
    if (s === 'scheduled') return 'Scheduled';
    return 'Live';
  }

  // ── Metric cells ───────────────────────────────────────────────
  metricCells(id: number): { label: string; value: string }[] {
    const m = getMetrics(id);
    return [
      { label: 'Reach', value: this.formatReach(m.reach) },
      { label: 'Rev',   value: `$${m.revenue}` },
      { label: 'CTR',   value: `${m.ctr}%` },
    ];
  }

  // ── Online/Offline button style ────────────────────────────────
  onlineButtonStyle(id: number): string {
    return this.screenService.isContentOffline(id)
      ? 'background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); color:#f87171'
      : 'background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.2); color:#4ade80';
  }

  // ── Selection ──────────────────────────────────────────────────
  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isSelected(id: number): boolean { return this.selectedIds().has(id); }
  clearSelection(): void          { this.selectedIds.set(new Set()); }

  // ── Bulk actions ───────────────────────────────────────────────
  archiveSelected(): void {
    this.contentService.archiveContents([...this.selectedIds()]).subscribe({
      next: () => this.clearSelection(),
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    let remaining = ids.length;
    ids.forEach(id =>
      this.contentService.deleteContent(id).subscribe({
        next: () => { if (--remaining === 0) this.clearSelection(); },
      }),
    );
  }

  // ── Detail modal ───────────────────────────────────────────────
  openDetail(item: Content, event: MouseEvent): void { event.stopPropagation(); this.detailContent.set(item); }
  closeDetail(): void                                { this.detailContent.set(null); }

  toggleContentStatus(contentId: number): void {
    const next = this.screenService.isContentOffline(contentId) ? 'online' : 'offline';
    this.screenService.setContentStatus(contentId, next);
  }

  // ── Proof of Play ──────────────────────────────────────────────
  openPoP(id: number, name: string): void { this.popTargetId.set(id); this.popTargetName.set(name); }
  closePoP(): void                        { this.popTargetId.set(null); }

  // ── Misc ───────────────────────────────────────────────────────
  categoryName(id: number | null): string { return id != null ? (this.categoryMap().get(id) ?? '') : ''; }
  formatReach(n: number): string          { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`; }
  showTriggerBadge(id: number): boolean   { return id % 3 === 0; }
  triggerLabel(id: number): string        { return ['Clima', 'Hora pico', 'Ubicación'][id % 3]; }

  // ── Sparklines ─────────────────────────────────────────────────
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
    const d = this.genSpark(id), w = 46, h = 15;
    const max = Math.max(...d), min = Math.min(...d), range = max - min || 1;
    return d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  }

  sparklineArea(id: number): string { return `0,15 ${this.sparklinePts(id)} 46,15`; }
}
