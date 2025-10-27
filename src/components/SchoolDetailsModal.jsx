import React from 'react';

const SchoolDetailsModal = ({ school, isOpen, onClose, loading = false }) => {
  if (!isOpen || !school) return null;

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deal-details-header school-header">
          <div className="deal-title-section">
            <h2 className="deal-title">School Details</h2>
            <p className="deal-subtitle">{school.name || school.dealName || 'School Information'}</p>
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
              <div>Loading school details...</div>
            </div>
          )}
          
          {/* School Name Card */}
          <div className="info-card school-name-card">
            <div className="card-icon school-name-icon" style={{ color: '#3b82f6' }}>🎓</div>
            <div className="card-content">
              <span className="card-label">SCHOOL NAME</span>
              <span className="card-value">{school.name || school.dealName || 'N/A'}</span>
            </div>
          </div>

          {/* School Type Card */}
          <div className="info-card school-type-card">
            <div className="card-icon school-type-icon" style={{ color: '#8b5cf6' }}>📖</div>
            <div className="card-content">
              <span className="card-label">SCHOOL TYPE</span>
              <span className="card-value school-type-value" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                {school.type || school.school_type || 'N/A'}
              </span>
            </div>
          </div>

          {/* Address Card */}
          <div className="info-card school-address-card">
            <div className="card-icon school-address-icon" style={{ color: '#ef4444' }}>📍</div>
            <div className="card-content">
              <span className="card-label">ADDRESS</span>
              <span className="card-value">{school.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailsModal;
