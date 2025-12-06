// src/contexts/DataContext.jsx - UPDATED VERSION
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import supabase from '../supabaseClient';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchWithCache = useCallback(async (key, fetchFunction, options = {}) => {
    const {
      cacheTime = 30000,
      forceRefresh = false,
      dependencies = []
    } = options;

    const now = Date.now();
    const cacheKey = `${key}_${dependencies.join('_')}`;
    const cached = cache[cacheKey];
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp < cacheTime)) {
      console.log(`Using cached data for ${cacheKey}`);
      return cached.data;
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setErrors(prev => ({ ...prev, [cacheKey]: null }));

    try {
      const result = await fetchFunction();
      
      // Update cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          timestamp: now,
          data: result
        }
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      console.error(`Error fetching ${key}:`, error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [cache]);

  // Check if any loading state is active for a key
  const isLoading = useCallback((key) => {
    return Object.keys(loading).some(k => k.startsWith(key) && loading[k]);
  }, [loading]);

  // Get error for a specific key
  const getError = useCallback((key) => {
    return Object.keys(errors).find(k => k.startsWith(key))?.error || null;
  }, [errors]);

  // Generic fetch function
  const fetchData = useCallback(async (table, options = {}) => {
    const {
      select = '*',
      filters = {},
      order = { column: 'created_at', ascending: false },
      limit = null,
      cacheKey = table,
      ...fetchOptions
    } = options;

    const fetchFunction = async () => {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (order) {
        query = query.order(order.column, { ascending: order.ascending });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        throw error;
      }

      return data || [];
    };

    return fetchWithCache(cacheKey, fetchFunction, fetchOptions);
  }, [fetchWithCache]);

  // Dashboard stats
  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    const fetchFunction = async () => {
      try {
        // Get today's date in correct format
        const today = new Date().toISOString().split('T')[0];
        
        // Helper function to safely fetch count
        const fetchCount = async (table, filters = {}) => {
          try {
            let query = supabase.from(table).select('*', { count: 'exact', head: true });
            
            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined) {
                query = query.eq(key, value);
              }
            });
            
            const { count, error } = await query;
            
            if (error) {
              console.warn(`Error counting ${table}:`, error);
              return 0;
            }
            
            return count || 0;
          } catch (err) {
            console.warn(`Error in fetchCount for ${table}:`, err);
            return 0;
          }
        };

        // Fetch counts in parallel
        const [
          totalUsers,
          totalBranches,
          totalLoans,
          activeLoans,
          pendingApprovals,
          todayTransactions
        ] = await Promise.all([
          fetchCount('users_meta'),
          fetchCount('branches'),
          fetchCount('member_loans'),
          fetchCount('member_loans', { status: 'active' }),
          fetchCount('group_loan_requests', { status: 'pending' }),
          (async () => {
            try {
              const { count, error } = await supabase
                .from('weekly_transactions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', `${today}T00:00:00`);
              
              return error ? 0 : (count || 0);
            } catch {
              return 0;
            }
          })()
        ]);

        // Get total members (adjust table name as needed)
        const totalMembers = await fetchCount('members') || 0;

        return {
          totalUsers,
          totalBranches,
          totalMembers,
          totalLoans,
          activeLoans,
          pendingApprovals,
          todayTransactions,
          systemHealth: 'Good',
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    };

    return fetchWithCache('dashboardStats', fetchFunction, {
      cacheTime: 60000,
      forceRefresh
    });
  }, [fetchWithCache]);

  // Common data fetchers
  const fetchUsers = useCallback((options = {}) => {
    return fetchData('users_meta', {
      cacheKey: 'users',
      cacheTime: 30000,
      ...options
    });
  }, [fetchData]);

  const fetchBranches = useCallback((options = {}) => {
    return fetchData('branches', {
      cacheKey: 'branches',
      cacheTime: 60000,
      ...options
    });
  }, [fetchData]);

  const fetchLoans = useCallback((options = {}) => {
    return fetchData('member_loans', {
      cacheKey: 'loans',
      cacheTime: 30000,
      ...options
    });
  }, [fetchData]);

  // Cache management
  const clearCache = useCallback((key = null) => {
    if (key) {
      // Clear specific cache and all related caches
      const keysToClear = Object.keys(cache).filter(k => k.startsWith(key));
      setCache(prev => {
        const newCache = { ...prev };
        keysToClear.forEach(k => delete newCache[k]);
        return newCache;
      });
      
      // Clear errors for those keys
      setErrors(prev => {
        const newErrors = { ...prev };
        keysToClear.forEach(k => delete newErrors[k]);
        return newErrors;
      });
    } else {
      // Clear all cache
      setCache({});
      setErrors({});
    }
  }, [cache]);

  const clearError = useCallback((key) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const value = {
    // Fetch functions
    fetchWithCache,
    fetchData,
    fetchUsers,
    fetchBranches,
    fetchLoans,
    fetchDashboardStats,
    
    // Cache management
    clearCache,
    clearError,
    
    // State
    loading,
    errors,
    cache,
    
    // Helper functions
    isLoading,
    getError
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;