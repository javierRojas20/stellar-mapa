import React from 'react';

const RentDetailsModal = ({ rent, isOpen, onClose, loading = false }) => {
  if (!isOpen || !rent) return null;

  const getModalTitle = () => {
    return {
      title: 'Rent Details',
      subtitle: rent.name || rent.dealName || 'Rent Information'
    };
  };

  const { title, subtitle } = getModalTitle();

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`deal-details-header rent-header`}>
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
              <div>Loading rent details...</div>
            </div>
          )}

          {/* Product Type Card */}
          <div className="info-card product-type-card">
            <div className="card-icon product-icon" style={{ color: '#3b82f6' }}>🏠</div>
            <div className="card-content">
              <span className="card-label">PRODUCT TYPE</span>
              <span className="card-value">{rent.product_type || 'N/A'}</span>
            </div>
          </div>

          {/* Rent USD Card */}
          <div className="info-card rent-usd-card">
            <div className="card-icon rent-icon" style={{ color: '#22c55e' }}>$</div>
            <div className="card-content">
              <span className="card-label">RENT USD</span>
              <span className="card-value">${rent.rent_usd || 'N/A'}</span>
            </div>
          </div>

          {/* Size SQFT Card */}
          <div className="info-card size-sqft-card">
            <div className="card-icon size-icon" style={{ color: '#f59e0b' }}>📐</div>
            <div className="card-content">
              <span className="card-label">SIZE SQFT</span>
              <span className="card-value">{rent.size_sqft || 'N/A'} sqft</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Product Type</span>
                <span className="summary-value">{rent.product_type || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Rent</span>
                <span className="summary-value">${rent.rent_usd || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Size</span>
                <span className="summary-value">{rent.size_sqft || 'N/A'} sqft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentDetailsModal;



