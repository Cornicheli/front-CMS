// Verified against GET /api/mock-data — 2026-04-28
// Note: API returns no created_at on folders

export interface Folder {
  id: number;
  name: string;
  /** null for root-level folders */
  parent_id: number | null;
}
