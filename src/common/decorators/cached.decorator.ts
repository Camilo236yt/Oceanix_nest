import { SetMetadata, UseInterceptors } from '@nestjs/common';
import { CacheOptions } from '../interfaces';
import { CacheInterceptor } from '../interceptors';

export const CACHE_OPTIONS_KEY = 'cache_options';

export function Cached(options: CacheOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Set metadata with cache options
    SetMetadata(CACHE_OPTIONS_KEY, options)(target, propertyKey, descriptor);
    
    // Apply the cache interceptor
    UseInterceptors(CacheInterceptor)(target, propertyKey, descriptor);
  };
}