import React from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, Clock, CheckCircle, AlertCircle, 
  BarChart3, Target, Users, DollarSign 
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

const FacilitatorPerformance = ({ 
  facilitator, 
  performanceData,
  loading = false 
}) => {
  if (loading || !facilitator) {
    return (
      <div className="loading-placeholder">
        <div className="loading-skeleton" style={{ height: '400px' }}></div>
      </div>
    );
  }

  const metrics = facilitator.performance_metrics || {};
  const performance = performanceData || {};

  return (
    <div className="facilitator-performance">
      <div className="performance-header">
        <div className="facilitator-info">
          <h3>{facilitator.full_name}</h3>
          <p>Facilitator Performance Dashboard</p>
        </div>
        <div className="overall-score">
          <div className="score-circle">
            <span className="score-value">{formatPercentage(metrics.accuracyScore || 0)}</span>
            <span className="score-label">Overall Score</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <h3>{metrics.groupsHandled || 0}</h3>
            <p>Groups Handled</p>
            <small>{performance.active_groups || 0} active</small>
          </div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <h3>{formatCurrency(metrics.totalCollections || 0)}</h3>
            <p>Total Collections</p>
            <small>{performance.collections_count || 0} transactions</small>
          </div>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <h3>{formatPercentage(metrics.onTimeScore || 0)}</h3>
            <p>On-Time Submission</p>
            <small>Last 30 days</small>
          </div>
        </div>
        
        <div className="metric-card info">
          <div className="metric-icon">
            <CheckCircle size={24} />
          </div>
          <div className="metric-info">
            <h3>{facilitator.error_count || 0}</h3>
            <p>Errors Flagged</p>
            <small>{performance.resolved_errors || 0} resolved</small>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h4><BarChart3 size={18} /> Accuracy Trend</h4>
          </div>
          <div className="chart-content">
            <div className="trend-chart">
              {performance.accuracy_trend?.map((point, index) => (
                <div key={index} className="trend-point">
                  <div className="point-value">{point.score}%</div>
                  <div className="point-line"></div>
                  <div className="point-label">{point.period}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4><Target size={18} /> Performance Metrics</h4>
          </div>
          <div className="chart-content">
            <div className="metrics-list">
              <div className="metric-item">
                <span>Submission Timeliness</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ width: `${metrics.onTimeScore || 0}%` }}
                  ></div>
                  <span className="metric-value">{formatPercentage(metrics.onTimeScore || 0)}</span>
                </div>
              </div>
              
              <div className="metric-item">
                <span>Data Accuracy</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ width: `${metrics.accuracyScore || 0}%` }}
                  ></div>
                  <span className="metric-value">{formatPercentage(metrics.accuracyScore || 0)}</span>
                </div>
              </div>
              
              <div className="metric-item">
                <span>Member Satisfaction</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ width: `${performance.member_satisfaction || 0}%` }}
                  ></div>
                  <span className="metric-value">{formatPercentage(performance.member_satisfaction || 0)}</span>
                </div>
              </div>
              
              <div className="metric-item">
                <span>Collection Success Rate</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ width: `${performance.collection_success || 0}%` }}
                  ></div>
                  <span className="metric-value">{formatPercentage(performance.collection_success || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <div className="section-header">
          <h4><TrendingUp size={18} /> Recent Activities</h4>
        </div>
        <div className="activities-list">
          {performance.recent_activities?.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'collection' && <DollarSign size={16} />}
                {activity.type === 'approval' && <CheckCircle size={16} />}
                {activity.type === 'error' && <AlertCircle size={16} />}
              </div>
              <div className="activity-details">
                <p>{activity.description}</p>
                <small>{activity.timestamp} • {activity.group}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h4>Performance Summary</h4>
          <div className="summary-content">
            <div className="strengths">
              <h5>Strengths</h5>
              <ul>
                <li>Excellent collection accuracy</li>
                <li>High on-time submission rate</li>
                <li>Good member relationship management</li>
              </ul>
            </div>
            <div className="improvements">
              <h5>Areas for Improvement</h5>
              <ul>
                <li>Reduce data entry errors</li>
                <li>Improve loan application documentation</li>
                <li>Increase member attendance in groups</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FacilitatorPerformance.propTypes = {
  facilitator: PropTypes.object,
  performanceData: PropTypes.shape({
    accuracy_trend: PropTypes.array,
    recent_activities: PropTypes.array,
    member_satisfaction: PropTypes.number,
    collection_success: PropTypes.number,
    active_groups: PropTypes.number,
    collections_count: PropTypes.number,
    resolved_errors: PropTypes.number
  }),
  loading: PropTypes.bool
};

export default FacilitatorPerformance;