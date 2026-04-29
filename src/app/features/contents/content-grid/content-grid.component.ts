import { Component, inject, signal, computed, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContentService } from '@features/contents/services/content.service';
import { Content } from '@models/content.model';

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
}
