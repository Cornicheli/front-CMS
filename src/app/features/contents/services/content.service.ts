import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import { Content, CreateContentRequest } from '@models/content.model';
import { Folder } from '@models/folder.model';
import { Category } from '@models/category.model';
import { ContentFilters } from '@models/filters.model';
import { MockDataResponse, ArchiveRequest } from '@models/api-response.model';
import { API_URL } from '@core/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  // ─── Raw state ────────────────────────────────────────
  readonly contents = signal<Content[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly folders = signal<Folder[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly filters = signal<ContentFilters>({});

  // ─── Derived state ────────────────────────────────────
  /**
   * Contents filtered client-side by the current `filters` signal.
   * Archived items are always excluded from this view.
   * Truthiness guard on each filter ensures empty-string form values are skipped.
   */
  readonly filteredContents = computed(() => {
    const { search, type, category_id, folder_id } = this.filters();

    return this.contents().filter((c) => {
      if (c.archived) return false;

      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // category_id / folder_id are `number | ''` — the truthiness guard
      // ensures empty-string (no selection) is always skipped, so the value
      // is a real number at comparison time. No Number() cast needed.
      if (category_id && c.category_id !== category_id) return false;
      if (folder_id && c.folder_id !== folder_id) return false;
      if (type && c.type !== type) return false;

      return true;
    });
  });

  // ─── HTTP Methods ─────────────────────────────────────

  /**
   * Load all data in a single round-trip and hydrate all signals.
   * `finalize` guarantees `isLoading` resets even on HTTP error.
   */
  loadMockData() {
    this.isLoading.set(true);
    return this.http.get<MockDataResponse>(`${API_URL}/mock-data`).pipe(
      tap((data) => {
        this.contents.set(data.contents);
        this.categories.set(data.categories);
        this.folders.set(data.folders);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  /** POST /api/contents — prepend server response to local state. */
  createContent(payload: CreateContentRequest) {
    return this.http.post<Content>(`${API_URL}/contents`, payload).pipe(
      tap((newContent) => {
        this.contents.update((list) => [newContent, ...list]);
      }),
    );
  }

  /** PATCH /api/contents/archive — mark items archived in local state. */
  archiveContents(ids: number[]) {
    const body: ArchiveRequest = { ids };
    return this.http.patch<void>(`${API_URL}/contents/archive`, body).pipe(
      tap(() => {
        this.contents.update((list) =>
          list.map((c) => (ids.includes(c.id) ? { ...c, archived: true } : c)),
        );
      }),
    );
  }

  /** DELETE /api/contents/:id — remove from local state without refetch. */
  deleteContent(id: number) {
    return this.http.delete<void>(`${API_URL}/contents/${id}`).pipe(
      tap(() => {
        this.contents.update((list) => list.filter((c) => c.id !== id));
      }),
    );
  }

  // ─── Filter helpers ───────────────────────────────────

  updateFilters(partial: Partial<ContentFilters>): void {
    this.filters.update((current) => ({ ...current, ...partial }));
  }

  resetFilters(): void {
    this.filters.set({});
  }
}
