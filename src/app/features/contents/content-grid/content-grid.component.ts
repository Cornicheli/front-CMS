import { Component, inject, signal, computed } from '@angular/core';
import { ContentService } from '@features/contents/services/content.service';

@Component({
  selector: 'app-content-grid',
  standalone: true,
  templateUrl: './content-grid.component.html',
})
export class ContentGridComponent {
  protected readonly contentService = inject(ContentService);

  readonly selectedIds = signal<Set<number>>(new Set());

  readonly hasSelection = computed(() => this.selectedIds().size > 0);
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

  deleteContent(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.contentService.deleteContent(id).subscribe();
  }

  readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];
}
