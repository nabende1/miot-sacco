import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Users, TrendingUp, Award, CheckCircle, AlertCircle, 
  BarChart3, Clock, Target, UserCheck, Star, TrendingDown,
  Zap, UserPlus, Shield, DollarSign, Download, Calendar,
  MessageSquare, Send, FileText, Settings, Filter, RefreshCw
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import './StaffMetrics.css';

const StatCard = ({ title, value, icon: Icon, status, subtitle, loading, trend, detail }) => {
  const statusColors = {
    success: 'from-emerald-500 to-emerald-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-rose-500 to-rose-600',
    primary: 'from-blue-500 to-blue-600',
    info: 'from-cyan-500 to-cyan-600'
  };

  return (
    <div className="stat-card bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${statusColors[status] || statusColors.primary}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            trend.direction === 'up' 
              ? 'text-emerald-700 bg-emerald-50' 
              : trend.direction === 'down'
                ? 'text-rose-700 bg-rose-50'
                : 'text-gray-700 bg-gray-100'
          }`}>
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
            {trend.value}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-xl font-bold text-gray-800 mt-1">
          {loading ? '...' : value}
        </h3>
      </div>
      
      <div className="flex flex-col space-y-1">
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
        {detail && (
          <p className="text-xs text-gray-400">{detail}</p>
        )}
      </div>
    </div>
  );
};

const StaffMetrics = ({ 
  metrics, 
  loading = false,
  onAction
}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const {
    totalFacilitators = 0,
    activeFacilitators = 0,
    avgAccuracyScore = 0,
    avgOnTimeScore = 0,
    totalCollections = 0,
    errorRate = 0,
    topPerformer = null,
    improvementAreas = [],
    performanceSummary = {
      highPerformers: 8,
      averagePerformers: 15,
      lowPerformers: 2,
      newStaff: 3
    }
  } = metrics || {};

  // Functional Quick Actions
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false);
      alert('Staff Performance Report generated successfully! Download will start shortly.');
      if (onAction) onAction('report_generated');
    }, 1500);
  };

  const handleRecognizeStaff = () => {
    const staffName = prompt('Enter staff name to recognize:');
    if (staffName) {
      const reason = prompt('Reason for recognition:');
      if (reason) {
        alert(`Recognition sent to ${staffName}! They'll receive notification for: ${reason}`);
        if (onAction) onAction('staff_recognized', { name: staffName, reason });
      }
    }
  };

  const handleScheduleTraining = () => {
    setIsScheduling(true);
    // Show training scheduling modal/component
    setSelectedAction('schedule_training');
  };

  const handleConfirmSchedule = () => {
    if (scheduledDate) {
      alert(`Training session scheduled for ${scheduledDate}`);
      if (onAction) onAction('training_scheduled', { date: scheduledDate });
      setScheduledDate('');
      setSelectedAction(null);
      setIsScheduling(false);
    }
  };

  const handlePerformanceReview = () => {
    const meetingTime = prompt('Schedule performance review meeting (e.g., "Tomorrow 10 AM"):');
    if (meetingTime) {
      const attendees = prompt('Enter attendees (comma-separated):');
      alert(`Performance review scheduled for ${meetingTime} with ${attendees}`);
      if (onAction) onAction('review_scheduled', { time: meetingTime, attendees });
    }
  };

  const handleSendMessage = () => {
    const message = prompt('Enter message to send to team:');
    if (message) {
      alert(`Message sent to all staff members: "${message}"`);
      if (onAction) onAction('message_sent', { message });
    }
  };

  const handleRefreshData = () => {
    if (onAction) onAction('refresh_data');
  };

  // Performance distribution data
  const performanceDistribution = [
    { level: 'High Performers', count: performanceSummary.highPerformers, color: 'emerald', icon: Star, criteria: 'Score > 90%' },
    { level: 'Average', count: performanceSummary.averagePerformers, color: 'blue', icon: UserCheck, criteria: 'Score 75-90%' },
    { level: 'Needs Improvement', count: performanceSummary.lowPerformers, color: 'amber', icon: AlertCircle, criteria: 'Score < 75%' },
    { level: 'New Staff', count: performanceSummary.newStaff, color: 'gray', icon: UserPlus, criteria: '< 30 days' }
  ];

  return (
    <div className="staff-metrics space-y-6">
      {/* SECTION 1: Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-blue-100 text-sm">Branch Manager Dashboard</p>
              </div>
            </div>
            <p className="text-blue-100 mt-2 max-w-2xl">
              Monitor team performance, manage staff development, and drive productivity improvements
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefreshData}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm font-medium text-blue-100">Branch Rating</p>
            <p className="text-2xl font-bold mt-1">
              {avgAccuracyScore > 85 ? 'Excellent' : avgAccuracyScore > 75 ? 'Good' : 'Needs Focus'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm font-medium text-blue-100">Team Size</p>
            <p className="text-2xl font-bold mt-1">{totalFacilitators} Staff</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm font-medium text-blue-100">This Month</p>
            <p className="text-2xl font-bold mt-1">+5.2% Growth</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm font-medium text-blue-100">Compliance</p>
            <p className="text-2xl font-bold mt-1">98.5%</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Quick Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Quick Actions
            </h2>
            <p className="text-gray-500 text-sm mt-1">Common management tasks - Click to execute</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">6 actions available</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="quick-action-btn bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group disabled:opacity-50"
          >
            <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Generate Report</span>
              {isGeneratingReport && (
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Generating...
                </div>
              )}
            </div>
          </button>

          <button 
            onClick={handleRecognizeStaff}
            className="quick-action-btn bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Recognize Staff</span>
              <span className="text-xs text-gray-500 block mt-1">Send appreciation</span>
            </div>
          </button>

          <button 
            onClick={handleScheduleTraining}
            className="quick-action-btn bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-amber-500 rounded-lg group-hover:bg-amber-600 transition-colors">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Schedule Training</span>
              <span className="text-xs text-gray-500 block mt-1">Team development</span>
            </div>
          </button>

          <button 
            onClick={handlePerformanceReview}
            className="quick-action-btn bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Performance Review</span>
              <span className="text-xs text-gray-500 block mt-1">Schedule meeting</span>
            </div>
          </button>

          <button 
            onClick={handleSendMessage}
            className="quick-action-btn bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-cyan-500 rounded-lg group-hover:bg-cyan-600 transition-colors">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Send Message</span>
              <span className="text-xs text-gray-500 block mt-1">Team communication</span>
            </div>
          </button>

          <button 
            onClick={() => {
              const data = {
                metrics,
                timestamp: new Date().toISOString(),
                branch: 'Main Branch'
              };
              alert('Exporting data...');
              if (onAction) onAction('data_exported', data);
            }}
            className="quick-action-btn bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-gray-600 rounded-lg group-hover:bg-gray-700 transition-colors">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="mt-3">
              <span className="font-medium text-gray-700">Export Data</span>
              <span className="text-xs text-gray-500 block mt-1">CSV/PDF formats</span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3: Key Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Key Performance Metrics
            </h2>
            <p className="text-gray-500 text-sm mt-1">Real-time performance indicators for decision making</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Updated just now
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Productivity Score"
            value={loading ? '...' : formatPercentage((avgAccuracyScore + avgOnTimeScore) / 2)}
            icon={TrendingUp}
            status={
              (avgAccuracyScore + avgOnTimeScore) / 2 > 85 ? 'success' :
              (avgAccuracyScore + avgOnTimeScore) / 2 > 75 ? 'warning' : 'danger'
            }
            subtitle="Overall efficiency"
            detail="Combined accuracy & timeliness"
            loading={loading}
            trend={{ 
              direction: (avgAccuracyScore + avgOnTimeScore) / 2 > 85 ? 'up' : 'down', 
              value: '+2.3%' 
            }}
          />
          
          <StatCard
            title="Active Staff"
            value={loading ? '...' : activeFacilitators}
            icon={UserCheck}
            status="primary"
            subtitle={`of ${totalFacilitators} total`}
            detail={`${totalFacilitators ? Math.round((activeFacilitators / totalFacilitators) * 100) : 0}% active rate`}
            loading={loading}
          />
          
          <StatCard
            title="Quality Score"
            value={loading ? '...' : formatPercentage(avgAccuracyScore)}
            icon={Shield}
            status={avgAccuracyScore > 85 ? 'success' : avgAccuracyScore > 75 ? 'warning' : 'danger'}
            subtitle="Data accuracy"
            detail={`${errorRate < 5 ? 'Low' : 'High'} error rate`}
            loading={loading}
            trend={{ direction: avgAccuracyScore > 85 ? 'up' : 'down', value: '+1.5%' }}
          />
          
          <StatCard
            title="Monthly Collections"
            value={loading ? '...' : formatCurrency(totalCollections)}
            icon={DollarSign}
            status="success"
            subtitle="Total processed"
            detail="All facilitators combined"
            loading={loading}
            trend={{ direction: 'up', value: '+8.7%' }}
          />
        </div>
      </div>

      {/* SECTION 4: Team Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Team Performance Distribution
              </h2>
              <p className="text-gray-500 text-sm mt-1">Staff categorized by performance levels</p>
            </div>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              <Send className="w-4 h-4" />
              Share Analysis
            </button>
          </div>

          <div className="space-y-6">
            {performanceDistribution.map((item) => (
              <div key={item.level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${item.color}-50`}>
                      <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{item.level}</p>
                      <p className="text-xs text-gray-500">{item.criteria}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{item.count}</p>
                    <p className="text-xs text-gray-500">
                      {totalFacilitators ? Math.round((item.count / totalFacilitators) * 100) : 0}% of team
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-${item.color}-500 transition-all duration-700`}
                    style={{ 
                      width: `${totalFacilitators ? (item.count / totalFacilitators) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Team Average Score</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {loading ? '...' : formatPercentage((avgAccuracyScore + avgOnTimeScore) / 2)}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-500">Coaching Required</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {performanceSummary.lowPerformers + performanceSummary.newStaff} staff
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Spotlight & Critical Metrics */}
        <div className="space-y-6">
          {/* Top Performer Spotlight */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Top Performer</h3>
                  <p className="text-sm text-gray-600">This month's best performer</p>
                </div>
              </div>
              <button 
                onClick={handleRecognizeStaff}
                className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Recognize
              </button>
            </div>
            
            {topPerformer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {topPerformer.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{topPerformer.name}</p>
                    <p className="text-sm text-gray-600">Lead Facilitator • 4.8★ Rating</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="text-lg font-bold text-gray-800">
                      {topPerformer.accuracy ? formatPercentage(topPerformer.accuracy) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs text-gray-500">Collections</p>
                    <p className="text-lg font-bold text-gray-800">
                      {topPerformer.collections ? formatCurrency(topPerformer.collections) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <button className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Performance Report
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No top performer data available</p>
              </div>
            )}
          </div>

          {/* Critical Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Critical Metrics Alert
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div>
                  <p className="font-medium text-gray-700">Error Rate</p>
                  <p className="text-xs text-gray-500">Data accuracy issues</p>
                </div>
                <div className={`text-lg font-bold ${
                  errorRate < 5 ? 'text-emerald-600' : 
                  errorRate < 10 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {formatPercentage(errorRate)}
                  {errorRate > 5 && (
                    <span className="text-xs ml-1 text-rose-600">⚠️</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-medium text-gray-700">Timeliness Score</p>
                  <p className="text-xs text-gray-500">On-time submissions</p>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {formatPercentage(avgOnTimeScore)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div>
                  <p className="font-medium text-gray-700">Training Required</p>
                  <p className="text-xs text-gray-500">Staff needing support</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-amber-600">
                    {performanceSummary.lowPerformers}
                  </div>
                  <button 
                    onClick={handleScheduleTraining}
                    className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Action Required */}
      {improvementAreas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600" />
                Priority Action Items
              </h2>
              <p className="text-gray-500 text-sm mt-1">Areas requiring immediate attention and follow-up</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-sm font-medium rounded-full">
                {improvementAreas.length} items
              </span>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
                View All →
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {improvementAreas.slice(0, 3).map((area, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border hover:shadow-sm transition-all duration-200 group cursor-pointer"
                style={{ 
                  borderColor: area.priority === 'High' ? '#fecaca' : 
                               area.priority === 'Medium' ? '#fed7aa' : '#bfdbfe'
                }}
                onClick={() => {
                  alert(`Opening action item: ${area.title}`);
                  if (onAction) onAction('action_item_opened', area);
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    area.priority === 'High' ? 'bg-rose-100' :
                    area.priority === 'Medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <AlertCircle className={`w-4 h-4 ${
                      area.priority === 'High' ? 'text-rose-600' :
                      area.priority === 'Medium' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {area.title}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        area.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                        area.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {area.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{area.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {area.affected_facilitators} affected
                  </span>
                  <button className="text-blue-600 font-medium hover:text-blue-700 text-sm">
                    Assign Action →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Scheduling Modal */}
      {selectedAction === 'schedule_training' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Schedule Training Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g., Data Accuracy Best Practices"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleConfirmSchedule}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Schedule Training
                </button>
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setIsScheduling(false);
                    setScheduledDate('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StaffMetrics.propTypes = {
  metrics: PropTypes.shape({
    totalFacilitators: PropTypes.number,
    activeFacilitators: PropTypes.number,
    avgAccuracyScore: PropTypes.number,
    avgOnTimeScore: PropTypes.number,
    totalCollections: PropTypes.number,
    errorRate: PropTypes.number,
    topPerformer: PropTypes.shape({
      name: PropTypes.string,
      score: PropTypes.number,
      accuracy: PropTypes.number,
      collections: PropTypes.number
    }),
    improvementAreas: PropTypes.array,
    performanceSummary: PropTypes.shape({
      highPerformers: PropTypes.number,
      averagePerformers: PropTypes.number,
      lowPerformers: PropTypes.number,
      newStaff: PropTypes.number
    })
  }),
  loading: PropTypes.bool,
  onAction: PropTypes.func // Callback for action events
};

export default StaffMetrics;