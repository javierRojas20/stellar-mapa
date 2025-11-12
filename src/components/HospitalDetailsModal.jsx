import React from 'react';

const HospitalDetailsModal = ({ hospital, isOpen, onClose, loading = false }) => {
  if (!isOpen || !hospital) return null;

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deal-details-header hospital-header">
          <div className="deal-title-section">
            <h2 className="deal-title">Hospital Details</h2>
            <p className="deal-subtitle">{hospital.name || hospital.dealName || 'Hospital Information'}</p>
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
              <div>Loading hospital details...</div>
            </div>
          )}
          
          {/* Hospital Name Card */}
          <div className="info-card hospital-name-card">
            <div className="card-icon hospital-name-icon" style={{ color: '#e91e63' }}>❤️</div>
            <div className="card-content">
              <span className="card-label">HOSPITAL NAME</span>
              <span className="card-value">{hospital.name || hospital.dealName || 'N/A'}</span>
            </div>
          </div>

          {/* Address Card */}
          <div className="info-card hospital-address-card">
            <div className="card-icon hospital-address-icon" style={{ color: '#f44336' }}>📍</div>
            <div className="card-content">
              <span className="card-label">ADDRESS</span>
              <span className="card-value">{hospital.address || 'N/A'}</span>
            </div>
          </div>

          {/* Leapfrog Hospital Grade Card */}
          <div className="info-card hospital-grade-card">
            <div className="card-icon hospital-grade-icon" style={{ 
              backgroundColor: '#4caf50', 
              color: 'white', 
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>A</div>
            <div className="card-content">
              <span className="card-label">LEAPFROG HOSPITAL GRADE</span>
              <span className="card-value">{hospital.leapfrog_grade || hospital.grade || hospital.rating || 'N/A'}</span>
            </div>
          </div>

          {/* Hospital Type Card */}
          <div className="info-card hospital-type-card">
            <div className="card-icon hospital-type-icon" style={{ color: '#9c27b0' }}>🏥</div>
            <div className="card-content">
              <span className="card-label">HOSPITAL TYPE</span>
              <span className="card-value">{hospital.hospital_type || hospital.type || 'N/A'}</span>
            </div>
          </div>

          {/* Phone Card */}
          <div className="info-card hospital-phone-card">
            <div className="card-icon hospital-phone-icon" style={{ color: '#ff9800' }}>📞</div>
            <div className="card-content">
              <span className="card-label">PHONE</span>
              <span className="card-value">{hospital.phone || hospital.phone_number || 'N/A'}</span>
            </div>
          </div>

          {/* Website Card */}
          <div className="info-card hospital-website-card">
            <div className="card-icon hospital-website-icon" style={{ color: '#2196f3' }}>🌐</div>
            <div className="card-content">
              <span className="card-label">WEBSITE</span>
              <span className="card-value">{hospital.website || hospital.url || 'N/A'}</span>
            </div>
          </div>

          {/* Emergency Services Card */}
          <div className="info-card hospital-emergency-card">
            <div className="card-icon hospital-emergency-icon" style={{ color: '#f44336' }}>🚨</div>
            <div className="card-content">
              <span className="card-label">EMERGENCY SERVICES</span>
              <span className="card-value">{hospital.emergency_services || hospital.emergency || 'N/A'}</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Hospital Name</span>
                <span className="summary-value">{hospital.name || hospital.dealName || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Address</span>
                <span className="summary-value">{hospital.address || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Leapfrog Grade</span>
                <span className="summary-value">{hospital.leapfrog_grade || hospital.grade || hospital.rating || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type</span>
                <span className="summary-value">{hospital.hospital_type || hospital.type || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetailsModal;

