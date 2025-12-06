// src/hooks/useCachedFetch.js
import { useState, useCallback, useRef } from 'react';

export function useCachedFetch(cacheDuration = 30000) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cacheRef = useRef({ timestamp: 0, data: null });

  const fetchData = useCallback(async (fetchFunction, forceRefresh = false) => {
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh && 
        cacheRef.current.data && 
        (now - cacheRef.current.timestamp < cacheDuration)) {
      console.log('Using cached data');
      return cacheRef.current.data;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await fetchFunction();
      
      // Update cache
      cacheRef.current = {
        timestamp: now,
        data
      };
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheDuration]);

  const clearCache = useCallback(() => {
    cacheRef.current = { timestamp: 0, data: null };
  }, []);

  return { fetchData, loading, error, clearCache };
}