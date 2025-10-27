import React from 'react';

const MasterPlanDetailsModal = ({ masterPlan, isOpen, onClose, loading = false }) => {
  if (!isOpen || !masterPlan) return null;

  const getModalTitle = () => {
    return {
      title: 'Master Plans Details',
      subtitle: masterPlan.name || masterPlan.dealName || 'Master Plan Information'
    };
  };

  const { title, subtitle } = getModalTitle();

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`deal-details-header masterplan-header`}>
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
              <div>Loading master plan details...</div>
            </div>
          )}

          {/* Master Plan Name Card */}
          <div className="info-card masterplan-name-card">
            <div className="card-icon masterplan-name-icon" style={{ color: '#DC2626' }}>🏗️</div>
            <div className="card-content">
              <span className="card-label">NAME</span>
              <span className="card-value">{masterPlan.name || masterPlan.dealName || 'N/A'}</span>
            </div>
          </div>

          {/* Developer Card */}
          <div className="info-card developer-card">
            <div className="card-icon developer-icon" style={{ color: '#3b82f6' }}>🏢</div>
            <div className="card-content">
              <span className="card-label">DEVELOPER</span>
              <span className="card-value">{masterPlan.developer || 'N/A'}</span>
            </div>
          </div>

          {/* Status Card */}
          <div className="info-card status-card">
            <div className="card-icon status-icon" style={{ color: '#10b981' }}>✅</div>
            <div className="card-content">
              <span className="card-label">STATUS</span>
              <span className="card-value">{masterPlan.status || 'N/A'}</span>
            </div>
          </div>

          {/* County Card */}
          <div className="info-card county-card">
            <div className="card-icon county-icon" style={{ color: '#8b5cf6' }}>🏛️</div>
            <div className="card-content">
              <span className="card-label">COUNTY</span>
              <span className="card-value">{masterPlan.county || 'N/A'}</span>
            </div>
          </div>

          {/* City Card */}
          <div className="info-card city-card">
            <div className="card-icon city-icon" style={{ color: '#ef4444' }}>🏙️</div>
            <div className="card-content">
              <span className="card-label">CITY</span>
              <span className="card-value">{masterPlan.city || 'N/A'}</span>
            </div>
          </div>

          {/* Price Range Card */}
          <div className="info-card price-range-card">
            <div className="card-icon price-icon" style={{ color: '#22c55e' }}>$</div>
            <div className="card-content">
              <span className="card-label">PRICE RANGE</span>
              <div className="price-range-values">
                <div className="price-min">
                  <span className="price-label">Minimum</span>
                  <span className="price-value" style={{ color: '#22c55e' }}>{masterPlan.price_min || 'N/A'}</span>
                </div>
                <div className="price-max">
                  <span className="price-label">Maximum</span>
                  <span className="price-value" style={{ color: '#22c55e' }}>{masterPlan.price_max || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Units Planned Card */}
          <div className="info-card units-planned-card">
            <div className="card-icon units-icon" style={{ color: '#f59e0b' }}>📊</div>
            <div className="card-content">
              <span className="card-label">TOTAL UNITS PLANNED</span>
              <span className="card-value">{masterPlan.total_units_planned || 'N/A'}</span>
            </div>
          </div>

          {/* Total Units Sold Card */}
          <div className="info-card units-sold-card">
            <div className="card-icon sold-icon" style={{ color: '#06b6d4' }}>🏠</div>
            <div className="card-content">
              <span className="card-label">TOTAL UNITS SOLD</span>
              <span className="card-value">{masterPlan.total_units_sold || 'N/A'}</span>
            </div>
          </div>

          {/* Date Opened Card */}
          <div className="info-card date-opened-card">
            <div className="card-icon date-icon" style={{ color: '#84cc16' }}>📅</div>
            <div className="card-content">
              <span className="card-label">DATE OPENED</span>
              <span className="card-value">{masterPlan.date_opened || 'N/A'}</span>
            </div>
          </div>

          {/* Date Sold Out Card */}
          <div className="info-card date-sold-out-card">
            <div className="card-icon sold-out-icon" style={{ color: '#dc2626' }}>🏁</div>
            <div className="card-content">
              <span className="card-label">DATE SOLD OUT</span>
              <span className="card-value">{masterPlan.date_sold_out || 'N/A'}</span>
            </div>
          </div>

          {/* Acreage Card */}
          <div className="info-card acreage-card">
            <div className="card-icon acreage-icon" style={{ color: '#059669' }}>🌾</div>
            <div className="card-content">
              <span className="card-label">ACREAGE</span>
              <span className="card-value">{masterPlan.acreage || 'N/A'}</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Name</span>
                <span className="summary-value">{masterPlan.name || masterPlan.dealName || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Developer</span>
                <span className="summary-value">{masterPlan.developer || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status</span>
                <span className="summary-value">{masterPlan.status || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Location</span>
                <span className="summary-value">{masterPlan.city || 'N/A'}, {masterPlan.county || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Units</span>
                <span className="summary-value">{masterPlan.total_units_sold || 'N/A'} / {masterPlan.total_units_planned || 'N/A'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Price Range</span>
                <span className="summary-value">${masterPlan.price_min || 'N/A'} - ${masterPlan.price_max || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPlanDetailsModal;
