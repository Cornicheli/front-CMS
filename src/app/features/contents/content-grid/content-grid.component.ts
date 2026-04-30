import { Component, inject, signal, computed, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContentService } from '@features/contents/services/content.service';
import { Content } from '@models/content.model';
import { getMetrics } from '@models/zone.model';

@Component({
  selector: 'app-content-grid',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './content-grid.component.html',
})
export class ContentGridComponent {
  protected readonly contentService = inject(ContentService);

  readonly editContent = output<Content>();

  /** Map category_id → name for display on cards */
  readonly categoryMap = computed(() => {
    const map = new Map<number, string>();
    for (const cat of this.contentService.categories()) {
      map.set(cat.id, cat.name);
    }
    return map;
  });

  readonly selectedIds     = signal<Set<number>>(new Set());
  readonly activeMenuId    = signal<number | null>(null);
  readonly confirmDeleteId = signal<number | null>(null);

  readonly hasSelection   = computed(() => this.selectedIds().size > 0);
  readonly selectionCount = computed(() => this.selectedIds().size);

  readonly allSelectedArchived = computed(() => {
    const ids = this.selectedIds();
    if (ids.size === 0) return false;
    const contents = this.contentService.contents();
    return [...ids].every(id => contents.find(c => c.id === id)?.archived === true);
  });

  toggleSelect(id: number): void {
    this.selectedIds.update((set) => {
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

  archiveSelected(): void {
    const ids = [...this.selectedIds()];
    this.contentService.archiveContents(ids).subscribe({
      next: () => this.clearSelection(),
    });
  }

  toggleSelected(): void {
    const ids = [...this.selectedIds()];
    if (this.allSelectedArchived()) {
      let done = 0;
      ids.forEach(id =>
        this.contentService.toggleArchive(id).subscribe(() => {
          if (++done === ids.length) this.clearSelection();
        })
      );
    } else {
      this.contentService.archiveContents(ids).subscribe({
        next: () => this.clearSelection(),
      });
    }
  }

  openMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuId.set(this.activeMenuId() === id ? null : id);
    this.confirmDeleteId.set(null);
  }

  closeMenu(): void { this.activeMenuId.set(null); }

  onToggleArchive(item: Content, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuId.set(null);
    this.contentService.toggleArchive(item.id).subscribe();
  }

  onEditClick(item: Content, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuId.set(null);
    this.editContent.emit(item);
  }

  requestDelete(id: number): void {
    this.confirmDeleteId.set(id);
    this.activeMenuId.set(null);
  }

  confirmDelete(id: number): void {
    this.contentService.deleteContent(id).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.selectedIds.update(set => { const n = new Set(set); n.delete(id); return n; });
      },
    });
  }

  cancelDelete(): void { this.confirmDeleteId.set(null); }

  readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];

  showTriggerBadge(id: number): boolean { return id % 3 === 0; }

  metrics(id: number) { return getMetrics(id); }
  fmtReach(n: number): string { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }
  fmtRev(n: number): string { return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + n; }
}
