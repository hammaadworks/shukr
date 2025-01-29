import { useMemo } from 'react';
import Fuse from 'fuse.js';

export const useFuzzySearch = <T>(
  items: T[], 
  query: string, 
  keys: string[] = [
    'translations.en', 
    'translations.ur', 
    'translations.es', 
    'translations.ar',
    'transliterations.ur.en',
    'en', 
    'ur', 
    'roman'
  ]
) => {
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys,
      threshold: 0.35, // Balanced threshold for minor spelling mistakes
      distance: 100,
      includeMatches: true,
      minMatchCharLength: 1,
      shouldSort: true,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [items, keys]);

  const results = useMemo(() => {
    if (!query) return items;
    return fuse.search(query).map(result => result.item as T);
  }, [fuse, query, items]);

  return results;
};
