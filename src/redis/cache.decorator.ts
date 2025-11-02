import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cacheKey';
export const CACHE_TTL_METADATA = 'cacheTtl';

export const Cache = (key: string, ttl?: number) => 
  SetMetadata(CACHE_KEY_METADATA, { key, ttl });