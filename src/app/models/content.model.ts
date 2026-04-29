// Verified against GET /api/mock-data and GET /api/contents — 2026-04-28

export const IAB_CATEGORIES = [
  'Automotriz', 'Finanzas', 'Tecnología', 'Retail',
  'Gastronomía', 'Entretenimiento', 'Salud', 'Viajes',
] as const;
export type IabCategory = typeof IAB_CATEGORIES[number];

export const CONTENT_DURATIONS = [10, 15, 30] as const;
export type ContentDuration = typeof CONTENT_DURATIONS[number];

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
  iab_category?: IabCategory | null;
  duration?: ContentDuration | null;
}

export interface UpdateContentRequest {
  name: string;
  type: ContentType;
  url: string;
  category_id?: number | null;
  folder_id?: number | null;
  has_audio?: boolean;
  iab_category?: IabCategory | null;
  duration?: ContentDuration | null;
}

export interface CreateContentRequest {
  name: string;
  type: ContentType;
  url: string;
  category_id?: number | null;
  folder_id?: number | null;
  has_audio?: boolean;
  iab_category?: IabCategory | null;
  duration?: ContentDuration | null;
}
