export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix: string; // Prefix for cache keys (e.g., 'tours', 'users')
  includeParams?: boolean; // Include query params in cache key (default: true)
  includeBody?: boolean; // Include request body in cache key (default: false)
  customKeyGenerator?: (req: any) => string; // Custom key generation function
}