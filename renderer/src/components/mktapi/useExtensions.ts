import { useState, useEffect, useCallback } from 'react';
import type { VSCodeExtension } from './index';
import { marketplaceAPI } from './index';
import type { ExtensionSearchOptions } from './index';

export interface UseExtensionsResult {
  extensions: VSCodeExtension[];
  loading: boolean;
  error: string | null;
  searchExtensions: (query: string) => Promise<void>;
  loadPopular: () => Promise<void>;
  loadFeatured: () => Promise<void>;
  loadByCategory: (category: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useExtensions = (initialLoad: boolean = true): UseExtensionsResult => {
  const [extensions, setExtensions] = useState<VSCodeExtension[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<ExtensionSearchOptions | null>(null);

  const handleRequest = useCallback(async (requestFn: () => Promise<VSCodeExtension[]>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      setExtensions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extensions');
      console.error('Extension loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchExtensions = useCallback(async (query: string) => {
    const searchOptions = { searchText: query, pageSize: 50 };
    setLastQuery(searchOptions);
    await handleRequest(() => marketplaceAPI.searchExtensions(searchOptions));
  }, [handleRequest]);

  const loadPopular = useCallback(async () => {
    setLastQuery({ sortBy: 'InstallCount', sortOrder: 'Descending', pageSize: 20 });
    await handleRequest(() => marketplaceAPI.getPopularExtensions(20));
  }, [handleRequest]);

  const loadFeatured = useCallback(async () => {
    setLastQuery({ sortBy: 'TrendingWeekly', sortOrder: 'Descending', pageSize: 10 });
    await handleRequest(() => marketplaceAPI.getFeaturedExtensions(10));
  }, [handleRequest]);

  const loadByCategory = useCallback(async (category: string) => {
    const searchOptions = { categories: [category], pageSize: 20 };
    setLastQuery(searchOptions);
    await handleRequest(() => marketplaceAPI.searchByCategory(category, 20));
  }, [handleRequest]);

  const refresh = useCallback(async () => {
    if (lastQuery) {
      await handleRequest(() => marketplaceAPI.searchExtensions(lastQuery));
    } else {
      await loadPopular();
    }
  }, [handleRequest, lastQuery, loadPopular]);

  useEffect(() => {
    if (initialLoad) {
      loadPopular();
    }
  }, [initialLoad, loadPopular]);

  return {
    extensions,
    loading,
    error,
    searchExtensions,
    loadPopular,
    loadFeatured,
    loadByCategory,
    refresh
  };
};