import React from 'react';
import PropTypes from 'prop-types';
import { Filter, Search, Building2 } from 'lucide-react';

const GroupFilters = ({ 
  search, 
  onSearchChange, 
  filter, 
  onFilterChange,
  loading = false 
}) => {
  return (
    <div className="group-filters">
      <div className="filters-section">
        <div className="filter-group">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search groups by name, code, or facilitator..."
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
            <option value="all">All Groups</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="default">Defaulting</option>
            <option value="excellent">Excellent Performance</option>
            <option value="good">Good Performance</option>
            <option value="poor">Poor Performance</option>
          </select>
          
          <button className="btn btn-secondary" disabled={loading}>
            <Filter size={16} /> Apply Filters
          </button>
        </div>
        
        <div className="summary-stats">
          <div className="stat-item">
            <Building2 size={16} />
            <span>Total Groups</span>
            <strong>0</strong>
          </div>
          <div className="stat-item">
            <span>Active</span>
            <strong className="success">0</strong>
          </div>
          <div className="stat-item">
            <span>Defaulting</span>
            <strong className="danger">0</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

GroupFilters.propTypes = {
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default GroupFilters;