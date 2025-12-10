import React from 'react';
import PropTypes from 'prop-types';
import { Filter, Search, Calendar, X } from 'lucide-react';

const FilterBar = ({
  filters,
  onFilterChange,
  onSearch,
  searchPlaceholder = "Search...",
  onClearFilters,
  showDateRange = false,
  loading = false
}) => {
  const handleSearch = (e) => {
    const value = e.target.value;
    onSearch?.(value);
  };

  const handleFilterChange = (filterKey, value) => {
    onFilterChange?.({ ...filters, [filterKey]: value });
  };

  const handleDateChange = (dateType, value) => {
    handleFilterChange('dateRange', {
      ...filters.dateRange,
      [dateType]: value
    });
  };

  const hasActiveFilters = () => {
    if (filters.search && filters.search.trim() !== '') return true;
    if (filters.dateRange?.start || filters.dateRange?.end) return true;
    return Object.entries(filters)
      .filter(([key]) => !['search', 'dateRange'].includes(key))
      .some(([_, value]) => value && value !== 'all');
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        {/* Search Input */}
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.search || ''}
            onChange={handleSearch}
            className="form-control"
            disabled={loading}
          />
        </div>

        {/* Dynamic Filters */}
        {Object.entries(filters).map(([key, value]) => {
          if (key === 'search' || key === 'dateRange') return null;
          
          // This would be dynamic based on your filter configuration
          const filterOptions = [
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ];

          return (
            <select
              key={key}
              value={value || 'all'}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="form-select"
              disabled={loading}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        })}

        {/* Date Range Filter */}
        {showDateRange && (
          <div className="date-range">
            <Calendar size={18} />
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="form-control"
              disabled={loading}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
        )}

        {/* Apply/Clear Filters */}
        <div className="filter-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => console.log('Apply filters')}
            disabled={loading}
          >
            <Filter size={16} /> Apply
          </button>
          
          {hasActiveFilters() && (
            <button
              className="btn btn-outline"
              onClick={onClearFilters}
              disabled={loading}
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="active-filters">
          <span className="filter-label">Active Filters:</span>
          
          {filters.search && filters.search.trim() !== '' && (
            <span className="filter-tag">
              Search: "{filters.search}"
              <button onClick={() => handleFilterChange('search', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          
          {filters.dateRange?.start && (
            <span className="filter-tag">
              From: {filters.dateRange.start}
              <button onClick={() => handleDateChange('start', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          
          {filters.dateRange?.end && (
            <span className="filter-tag">
              To: {filters.dateRange.end}
              <button onClick={() => handleDateChange('end', '')}>
                <X size={12} />
              </button>
            </span>
          )}
          
          {/* Other filters */}
          {Object.entries(filters)
            .filter(([key, value]) => 
              !['search', 'dateRange'].includes(key) && 
              value && value !== 'all'
            )
            .map(([key, value]) => (
              <span key={key} className="filter-tag">
                {key}: {value}
                <button onClick={() => handleFilterChange(key, 'all')}>
                  <X size={12} />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

FilterBar.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func,
  onSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  onClearFilters: PropTypes.func,
  showDateRange: PropTypes.bool,
  loading: PropTypes.bool
};

export default FilterBar;