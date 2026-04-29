import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import { Content, CreateContentRequest, UpdateContentRequest } from '@models/content.model';
import { Folder } from '@models/folder.model';
import { Category } from '@models/category.model';
import { ContentFilters } from '@models/filters.model';
import { MockDataResponse, ArchiveRequest } from '@models/api-response.model';
import { API_URL } from '@core/constants/api.constants';

interface RequestState { loading: boolean; error: string | null; }

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  // ─── Raw state ────────────────────────────────────────
  readonly contents = signal<Content[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly folders = signal<Folder[]>([]);
  readonly filters = signal<ContentFilters>({});

  readonly loadState     = signal<RequestState>({ loading: false, error: null });
  readonly mutationState = signal<RequestState>({ loading: false, error: null });

  // Backward-compat: all existing template refs to contentService.isLoading() keep working
  readonly isLoading = computed(() => this.loadState().loading);

  // ─── Derived state ────────────────────────────────────
  /**
   * Contents filtered client-side by the current `filters` signal.
   * showArchived controls whether active or archived items are shown.
   */
  readonly filteredContents = computed(() => {
    const { search, type, category_id, folder_id, showArchived } = this.filters();

    return this.contents().filter((c) => {
      // archived visibility
      if (showArchived) { if (!c.archived) return false; }
      else              { if (c.archived)  return false; }

      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (category_id && c.category_id !== category_id) return false;
      if (folder_id && c.folder_id !== folder_id) return false;
      if (type && c.type !== type) return false;

      return true;
    });
  });

  // ─── KPI signals (folder-scoped) ──────────────────────
  /** Scoped to current folder only — ignores search/type/category/showArchived */
  readonly folderScopedContents = computed(() => {
    const { folder_id } = this.filters();
    if (!folder_id) return this.contents();
    return this.contents().filter((c) => c.folder_id === folder_id);
  });

  readonly kpiTotal    = computed(() => this.folderScopedContents().length);
  readonly kpiActive   = computed(() => this.folderScopedContents().filter(c => !c.archived).length);
  readonly kpiArchived = computed(() => this.folderScopedContents().filter(c => c.archived).length);
  readonly kpiViews    = computed(() =>
    this.folderScopedContents().reduce((sum, c) => sum + this.simulatedViews(c.id), 0)
  );

  private simulatedViews(id: number): number { return ((id * 1337) % 9000) + 1000; }

  // ─── HTTP Methods ─────────────────────────────────────

  /**
   * Load all data in a single round-trip and hydrate all signals.
   * `finalize` guarantees `loadState` resets even on HTTP error.
   */
  loadMockData() {
    this.loadState.set({ loading: true, error: null });
    return this.http.get<MockDataResponse>(`${API_URL}/mock-data`).pipe(
      tap((data) => {
        this.contents.set(data.contents);
        this.categories.set(data.categories);
        this.folders.set(data.folders);
      }),
      finalize(() => this.loadState.update((s) => ({ ...s, loading: false }))),
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

  /** PUT /api/contents/:id — update item in local state without refetch. */
  updateContent(id: number, payload: UpdateContentRequest) {
    this.mutationState.set({ loading: true, error: null });
    return this.http.put<Content>(`${API_URL}/contents/${id}`, payload).pipe(
      tap((updated) => {
        this.contents.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
      }),
      finalize(() => this.mutationState.update((s) => ({ ...s, loading: false }))),
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
