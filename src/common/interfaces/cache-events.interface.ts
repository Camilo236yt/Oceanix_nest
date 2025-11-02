export interface CacheInvalidationEvent {
  entityName: string;
  operation: 'create' | 'update' | 'delete';
  entityId?: string;
  affectedPatterns: string[];
}

export interface TourEvent {
  id: string;
  operation: 'created' | 'updated' | 'deleted';
  data?: any;
}

export interface UserEvent {
  id: string;
  operation: 'created' | 'updated' | 'deleted';
  data?: any;
}

export interface BookingEvent {
  id: string;
  operation: 'created' | 'updated' | 'deleted';
  data?: any;
}

export interface YachtEvent {
  id: string;
  operation: 'created' | 'updated' | 'deleted';
  data?: any;
}

export interface CategoryEvent {
  id: string;
  operation: 'created' | 'updated' | 'deleted';
  data?: any;
}