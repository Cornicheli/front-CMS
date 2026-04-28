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

/**
 * Build a recursive tree from a flat Folder[] array.
 *
 * Safety guards:
 * - `ancestorIds` tracks the ID path from root to the current node.
 *   A folder is skipped if its ID is already in this path, which
 *   breaks any cycle (self-reference, A→B→A, etc.) without throwing.
 * - `maxDepth` (default 50) stops runaway recursion on deeply
 *   corrupt data before it can exhaust the call stack.
 */
export function buildFolderTree(
  folders: Folder[],
  parentId: number | null = null,
  ancestorIds: Set<number> = new Set(),
  maxDepth = 50,
): FolderNode[] {
  if (maxDepth <= 0) return [];

  return folders
    .filter((f) => f.parent_id === parentId && !ancestorIds.has(f.id))
    .map((f) => {
      const nextAncestors = new Set(ancestorIds);
      nextAncestors.add(f.id);
      return {
        ...f,
        children: buildFolderTree(folders, f.id, nextAncestors, maxDepth - 1),
      };
    });
}
