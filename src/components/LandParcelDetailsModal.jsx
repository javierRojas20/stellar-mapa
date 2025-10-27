import React from 'react';

const LandParcelDetailsModal = ({ landParcel, isOpen, onClose, loading = false }) => {
  if (!isOpen || !landParcel) return null;

  const getModalTitle = () => {
    return {
      title: 'Land Parcels Details',
      subtitle: landParcel.name || landParcel.dealName || 'Land Parcel Information'
    };
  };

  const { title, subtitle } = getModalTitle();

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`deal-details-header landparcel-header`}>
          <div className="deal-title-section">
            <h2 className="deal-title">{title}</h2>
            <p className="deal-subtitle">{subtitle}</p>
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
              <div>Loading land parcel details...</div>
            </div>
          )}

          {/* Area Acres Card */}
          <div className="info-card area-acres-card">
            <div className="card-icon area-icon" style={{ color: '#059669' }}>🌾</div>
            <div className="card-content">
              <span className="card-label">AREA ACRES</span>
              <span className="card-value">{landParcel.area_acres || 'N/A'}</span>
            </div>
          </div>

          {/* FLUM Card */}
          <div className="info-card flum-card">
            <div className="card-icon flum-icon" style={{ color: '#3b82f6' }}>📋</div>
            <div className="card-content">
              <span className="card-label">FLUM</span>
              <span className="card-value">{landParcel.flum || 'N/A'}</span>
            </div>
          </div>

          {/* Zone Card */}
          <div className="info-card zone-card">
            <div className="card-icon zone-icon" style={{ color: '#8b5cf6' }}>🏗️</div>
            <div className="card-content">
              <span className="card-label">ZONE</span>
              <span className="card-value">{landParcel.zone || 'N/A'}</span>
            </div>
          </div>


          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Area</span>
                <span className="summary-value">{landParcel.area_acres || 'N/A'} acres</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">FLUM</span>
                <span className="summary-value">{landParcel.flum || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Zone</span>
                <span className="summary-value">{landParcel.zone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandParcelDetailsModal;
