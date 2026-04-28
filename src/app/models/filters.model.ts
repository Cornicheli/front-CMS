import { ContentType } from './content.model';

export interface ContentFilters {
  search?: string;
  type?: ContentType | '';
  category_id?: number | '';
  folder_id?: number | '';
}
