export interface ISearchable {
  getSearchableFields(): string[];
  getSortableFields?(): string[];
  getFilterableFields?(): Record<string, string>;
  getDateField?(): string | null;
  getLocationFields?(): { latField: string | null; lngField: string | null };
}