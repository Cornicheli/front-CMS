import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ContentService } from './content.service';
import { Content } from '@models/content.model';

function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 1,
    name: 'Test content',
    type: 'image',
    url: 'https://cdn.example.com/asset.jpg',
    category_id: null,
    folder_id: null,
    has_audio: false,
    archived: false,
    created_at: '2026-01-01',
    ...overrides,
  };
}

describe('ContentService', () => {
  let service: ContentService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ContentService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  // ── filteredContents() ────────────────────────────────────────────

  describe('filteredContents()', () => {
    it('shows only active items when no filters are set', () => {
      service.contents.set([
        makeContent({ id: 1, archived: false }),
        makeContent({ id: 2, archived: true }),
      ]);
      const ids = service.filteredContents().map((c) => c.id);
      expect(ids).toEqual([1]);
    });

    it('shows only archived items when showArchived=true', () => {
      service.contents.set([
        makeContent({ id: 1, archived: false }),
        makeContent({ id: 2, archived: true }),
      ]);
      service.filters.set({ showArchived: true });
      const ids = service.filteredContents().map((c) => c.id);
      expect(ids).toEqual([2]);
    });

    it('filters by search case-insensitively', () => {
      service.contents.set([
        makeContent({ id: 1, name: 'Banner Verano' }),
        makeContent({ id: 2, name: 'Video Invierno' }),
      ]);
      service.filters.set({ search: 'VeRaNo' });
      const ids = service.filteredContents().map((c) => c.id);
      expect(ids).toEqual([1]);
    });

    it('filters by type=video', () => {
      service.contents.set([
        makeContent({ id: 1, type: 'image' }),
        makeContent({ id: 2, type: 'video' }),
      ]);
      service.filters.set({ type: 'video' });
      const ids = service.filteredContents().map((c) => c.id);
      expect(ids).toEqual([2]);
    });

    it('filters by type=image', () => {
      service.contents.set([
        makeContent({ id: 1, type: 'image' }),
        makeContent({ id: 2, type: 'video' }),
      ]);
      service.filters.set({ type: 'image' });
      const ids = service.filteredContents().map((c) => c.id);
      expect(ids).toEqual([1]);
    });
  });

  // ── createContent() ───────────────────────────────────────────────

  describe('createContent()', () => {
    it('prepends the new item to the contents signal', () => {
      service.contents.set([makeContent({ id: 1 })]);
      const newItem = makeContent({ id: 99, name: 'New asset' });

      service.createContent({ name: 'New asset', type: 'image', url: 'https://example.com/new.jpg' }).subscribe();

      const req = httpController.expectOne((r) => r.url.includes('/contents'));
      req.flush(newItem);

      expect(service.contents()[0].id).toBe(99);
      expect(service.contents().length).toBe(2);
    });
  });

  // ── deleteContent() ───────────────────────────────────────────────

  describe('deleteContent()', () => {
    it('removes the deleted item from the contents signal', () => {
      service.contents.set([makeContent({ id: 1 }), makeContent({ id: 2 })]);

      service.deleteContent(1).subscribe();

      const req = httpController.expectOne((r) => r.url.includes('/contents/1'));
      req.flush(null);

      expect(service.contents().map((c) => c.id)).toEqual([2]);
    });
  });

  // ── toggleArchive() ───────────────────────────────────────────────

  describe('toggleArchive()', () => {
    it('inverts the archived flag on the target item only', () => {
      service.contents.set([
        makeContent({ id: 1, archived: false }),
        makeContent({ id: 2, archived: false }),
      ]);

      service.toggleArchive(1).subscribe();

      const req = httpController.expectOne((r) => r.url.includes('/contents/1'));
      req.flush(makeContent({ id: 1, archived: true }));

      expect(service.contents().find((c) => c.id === 1)!.archived).toBe(true);
      expect(service.contents().find((c) => c.id === 2)!.archived).toBe(false);
    });
  });
});
