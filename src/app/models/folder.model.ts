// Verified against GET /api/mock-data — 2026-04-28
// Note: API returns no created_at on folders

export interface Folder {
  id: number;
  name: string;
  /** null for root-level folders */
  parent_id: number | null;
}

/** Folder enriched with its resolved children for tree rendering. */
export interface FolderNode extends Folder {
  children: FolderNode[];
}

/** Build a recursive tree from a flat Folder[] array. */
export function buildFolderTree(
  folders: Folder[],
  parentId: number | null = null,
): FolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .map((f) => ({ ...f, children: buildFolderTree(folders, f.id) }));
}
