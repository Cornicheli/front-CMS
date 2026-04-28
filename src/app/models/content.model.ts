// Verified against GET /api/mock-data and GET /api/contents — 2026-04-28

export type ContentType = 'image' | 'video';

export interface Content {
  id: number;
  name: string;
  type: ContentType;
  url: string;
  /** nullable — item may not belong to a category */
  category_id: number | null;
  /** nullable — item may not belong to a folder */
  folder_id: number | null;
  has_audio: boolean;
  archived: boolean;
  /** ISO date string: "YYYY-MM-DD" */
  created_at: string;
}

export interface CreateContentRequest {
  name: string;
  type: ContentType;
  url: string;
  category_id?: number | null;
  folder_id?: number | null;
  has_audio?: boolean;
}
