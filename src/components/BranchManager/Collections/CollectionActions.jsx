import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X, AlertCircle, FileText, Send, Printer, Download } from 'lucide-react';
import Modal from '../Common/Modal';

const CollectionActions = ({ 
  collection, 
  onApprove, 
  onFlag, 
  onExport,
  onPrint,
  loading = false 
}) => {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagComments, setFlagComments] = useState('');

  const handleApprove = () => {
    if (window.confirm('Are you sure you want to approve this collection?')) {
      onApprove(collection.id);
    }
  };

  const handleFlag = () => {
    if (!flagComments.trim()) {
      alert('Please enter flagging comments');
      return;
    }
    onFlag(collection.id, flagComments);
    setShowFlagModal(false);
    setFlagComments('');
  };

  const handleExport = (format) => {
    onExport(collection.id, format);
  };

  if (!collection) return null;

  return (
    <>
      <div className="collection-actions">
        <div className="action-buttons">
          {collection.status === 'submitted' && (
            <>
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={loading}
              >
                <Check size={16} /> Approve Collection
              </button>
              
              <button
                className="btn btn-warning"
                onClick={() => setShowFlagModal(true)}
                disabled={loading}
              >
                <AlertCircle size={16} /> Flag for Correction
              </button>
            </>
          )}
          
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('pdf')}
            disabled={loading}
          >
            <FileText size={16} /> Export as PDF
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => onPrint(collection.id)}
            disabled={loading}
          >
            <Printer size={16} /> Print
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('excel')}
            disabled={loading}
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
        
        {collection.status === 'flagged' && (
          <div className="flag-notice warning">
            <AlertCircle size={18} />
            <div>
              <strong>Flagged for Correction</strong>
              <p>{collection.review_comments}</p>
              <small>Flagged by: {collection.reviewed_by} on {collection.reviewed_at}</small>
            </div>
          </div>
        )}
      </div>

      {/* Flag Modal */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setFlagComments('');
        }}
        title="Flag Collection for Correction"
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Flagging Comments *</label>
            <textarea
              value={flagComments}
              onChange={(e) => setFlagComments(e.target.value)}
              placeholder="Explain what needs to be corrected..."
              rows={4}
              className="form-control"
              required
            />
            <small className="form-text">
              This message will be sent to the facilitator for correction
            </small>
          </div>
          
          <div className="form-group">
            <label>Priority Level</label>
            <select className="form-select">
              <option value="low">Low - Minor issues</option>
              <option value="medium">Medium - Needs attention</option>
              <option value="high">High - Critical issues</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Deadline for Correction</label>
            <input
              type="date"
              className="form-control"
              defaultValue={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
          </div>
        </div>
        
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowFlagModal(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-warning"
            onClick={handleFlag}
            disabled={loading || !flagComments.trim()}
          >
            <Send size={16} /> Send for Correction
          </button>
        </div>
      </Modal>
    </>
  );
};

CollectionActions.propTypes = {
  collection: PropTypes.object.isRequired,
  onApprove: PropTypes.func.isRequired,
  onFlag: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default CollectionActions;