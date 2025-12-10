import React from 'react';
import PropTypes from 'prop-types';
import { Filter, Search, Calendar } from 'lucide-react';

const CollectionsFilters = ({ 
  search, 
  onSearchChange, 
  filter, 
  onFilterChange,
  dateRange,
  onDateRangeChange,
  loading = false 
}) => {
  return (
    <div className="collections-filters">
      <div className="filters-section">
        <div className="filter-group">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by group, facilitator, or ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="submitted">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <div className="date-range">
            <Calendar size={18} />
            <input
              type="date"
              value={dateRange?.start || ''}
              onChange={(e) => onDateRangeChange?.({ ...dateRange, start: e.target.value })}
              className="form-control"
              disabled={loading}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange?.end || ''}
              onChange={(e) => onDateRangeChange?.({ ...dateRange, end: e.target.value })}
              className="form-control"
              disabled={loading}
            />
          </div>
          
          <button className="btn btn-secondary" disabled={loading}>
            <Filter size={16} /> Apply Filters
          </button>
        </div>
        
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Collections</span>
            <span className="stat-value">125</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending Review</span>
            <span className="stat-value warning">15</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">UGX 2.5M</span>
          </div>
        </div>
      </div>
    </div>
  );
};

CollectionsFilters.propTypes = {
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  dateRange: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string
  }),
  onDateRangeChange: PropTypes.func,
  loading: PropTypes.bool
};

export default CollectionsFilters;