// API response shapes verified against the running mock API — 2026-04-28

import { Content } from './content.model';
import { Folder } from './folder.model';
import { Category } from './category.model';

/** GET /api/mock-data */
export interface MockDataResponse {
  contents: Content[];
  categories: Category[];
  folders: Folder[];
}

/** GET /api/contents → paginated list */
export interface ContentListResponse {
  total: number;
  items: Content[];
}

/** PATCH /api/contents/archive */
export interface ArchiveRequest {
  ids: number[];
}
