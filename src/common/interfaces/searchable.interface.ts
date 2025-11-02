import { FilterType } from '../enums';

export interface ISearchable {
  getSearchableFields(): string[];
  getSortableFields?(): string[];
  getFilterableFields?(): Record<string, FilterType>;
  getDateField?(): string | null;
  getLocationFields?(): { latField: string | null; lngField: string | null };
}