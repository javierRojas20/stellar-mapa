import React from 'react';

const SubdivisionDetailsModal = ({ subdivision, isOpen, onClose, loading = false }) => {
  if (!isOpen || !subdivision) return null;

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deal-details-header subdivision-header">
          <div className="deal-title-section">
            <h2 className="deal-title">Subdivision Details</h2>
            <p className="deal-subtitle">{subdivision.dealName || subdivision.name || 'Subdivision Information'}</p>
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
              <div>Loading subdivision details...</div>
            </div>
          )}
          
          {/* Subdivision Name Card */}
          <div className="info-card subdivision-name-card">
            <div className="card-icon subdivision-name-icon">🏠</div>
            <div className="card-content">
              <span className="card-label">Subdivision</span>
              <span className="card-value">{subdivision.dealName || subdivision.name || 'N/A'}</span>
            </div>
          </div>

          {/* Developer Card */}
          <div className="info-card developer-card">
            <div className="card-icon developer-icon">🏢</div>
            <div className="card-content">
              <span className="card-label">Developer</span>
              <span className="card-value">{subdivision.developer || 'N/A'}</span>
            </div>
          </div>

          {/* Product Type Card */}
          <div className="info-card product-type-card">
            <div className="card-icon product-type-icon">🏠</div>
            <div className="card-content">
              <span className="card-label">Product Type</span>
              <span className="card-value">{subdivision.product_type || subdivision.product || 'N/A'}</span>
            </div>
          </div>

          {/* Status Card */}
          <div className="info-card status-card">
            <div className="card-icon status-icon">✅</div>
            <div className="card-content">
              <span className="card-label">Status</span>
              <span className="card-value">{subdivision.status || 'N/A'}</span>
            </div>
          </div>

          {/* City Card */}
          <div className="info-card city-card">
            <div className="card-icon city-icon">📍</div>
            <div className="card-content">
              <span className="card-label">City</span>
              <span className="card-value">{subdivision.city || 'N/A'}</span>
            </div>
          </div>

          {/* Lot Width Card */}
          <div className="info-card lot-width-card">
            <div className="card-icon lot-icon">📏</div>
            <div className="card-content">
              <span className="card-label">Lot Width</span>
              <div className="lot-width-values">
                <div className="lot-min">
                  <span className="lot-label">Minimum</span>
                  <span className="lot-value">{subdivision.minimum_lot_width || 'N/A'}</span>
                </div>
                <div className="lot-max">
                  <span className="lot-label">Maximum</span>
                  <span className="lot-value">{subdivision.maximum_lot_width || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Range Card */}
          <div className="info-card price-range-card">
            <div className="card-icon price-icon">$</div>
            <div className="card-content">
              <span className="card-label">Price Range</span>
              <div className="price-range-values">
                <div className="price-min">
                  <span className="price-label">Minimum</span>
                  <span className="price-value">{subdivision.price_min || 'N/A'}</span>
                </div>
                <div className="price-max">
                  <span className="price-label">Maximum</span>
                  <span className="price-value">{subdivision.price_max || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Units Planned Card */}
          <div className="info-card units-card">
            <div className="card-icon units-icon">👥</div>
            <div className="card-content">
              <span className="card-label">Units Planned</span>
              <span className="card-value units-value">{subdivision.units_planned || subdivision.units || 'N/A'}</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Name</span>
                <span className="summary-value">{subdivision.dealName || subdivision.name || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Developer</span>
                <span className="summary-value">{subdivision.developer || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status</span>
                <span className="summary-value">{subdivision.status || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Location</span>
                <span className="summary-value">{subdivision.city || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubdivisionDetailsModal;

