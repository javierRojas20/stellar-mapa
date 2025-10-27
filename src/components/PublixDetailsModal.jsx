import React from 'react';

const PublixDetailsModal = ({ publix, isOpen, onClose, loading = false }) => {
  if (!isOpen || !publix) return null;

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deal-details-header publix-header">
          <div className="deal-title-section">
            <h2 className="deal-title">Publix Details</h2>
            <p className="deal-subtitle">{publix.name || publix.dealName || 'Publix Location'}</p>
          </div>
          <div className="deal-actions">
            <button className="deal-action-btn close-btn" onClick={onClose} title="Close">
              <span>×</span>
            </button>
          </div>
        </div>

        <div className="deal-details-content">
          {loading && (
            <div className="loading-indicator" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '20px',
              fontSize: '16px',
              color: '#666'
            }}>
              <div style={{ marginRight: '10px' }}>⏳</div>
              <div>Loading publix details...</div>
            </div>
          )}
          
          {/* Address Card */}
          <div className="info-card publix-address-card">
            <div className="card-icon publix-address-icon" style={{ color: '#ef4444' }}>📍</div>
            <div className="card-content">
              <span className="card-label">ADDRESS</span>
              <span className="card-value">{publix.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublixDetailsModal;
