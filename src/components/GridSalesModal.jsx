import React from 'react';
import './GridSalesModal.css';

const GridSalesModal = ({ gridData, isOpen, onClose, loading = false }) => {
  if (!isOpen) return null;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="grid-sales-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Grid Sales Data</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="loading-spinner">Cargando datos...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!gridData) {
    return null;
  }

  const gridId = gridData.grid_id || gridData.id || 'N/A';
  const avgPrice = gridData.avg_price || gridData.average_price || 0;
  const priceChange = gridData.price_change_percent || gridData.price_change || 0;
  const salesCount = gridData.sales_count || 0;
  const singleFamilyCount = gridData.sales_count_single_family || gridData.single_family_count || 0;
  const townhomeCount = gridData.sales_count_townhome || gridData.townhome_count || 0;
  const condominiumCount = gridData.sales_count_condominium || gridData.condominium_count || 0;
  const totalSales = gridData.total_sales || salesCount;

  // Calcular valores por tipo
  const singleFamilyValue = gridData.single_family_value || (avgPrice * singleFamilyCount);
  const singleFamilyAvg = singleFamilyCount > 0 ? (singleFamilyValue / singleFamilyCount) : 0;
  
  const townhomeValue = gridData.townhome_value || 0;
  const townhomeAvg = townhomeCount > 0 ? (townhomeValue / townhomeCount) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="grid-sales-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Grid Sales Data</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Average Sale Price Card */}
          <div className="grid-stat-card price-card">
            <div className="stat-icon">$</div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(avgPrice)}</div>
              <div className="stat-change positive">
                {formatPercentage(priceChange)}
              </div>
              <div className="stat-label">vs last month</div>
            </div>
          </div>

          {/* Sales Count by Type */}
          <div className="grid-section">
            <div className="section-header">
              <div className="section-icon">🏠</div>
              <h3>Sales Count by Type</h3>
            </div>
            <div className="sales-list">
              <div className="sales-item">
                <span className="sales-label">Single Family</span>
                <span className="sales-count">{formatNumber(singleFamilyCount)}</span>
              </div>
              {townhomeCount > 0 && (
                <div className="sales-item">
                  <span className="sales-label">Townhome</span>
                  <span className="sales-count">{formatNumber(townhomeCount)}</span>
                </div>
              )}
              {condominiumCount > 0 && (
                <div className="sales-item">
                  <span className="sales-label">Condominium</span>
                  <span className="sales-count">{formatNumber(condominiumCount)}</span>
                </div>
              )}
              <div className="sales-item total">
                <span className="sales-label">Total Sales</span>
                <span className="sales-count total">{formatNumber(totalSales)}</span>
              </div>
            </div>
          </div>

          {/* Sales Value by Type */}
          <div className="grid-section">
            <div className="section-header">
              <div className="section-icon">📈</div>
              <h3>Sales Value by Type</h3>
            </div>
            <div className="value-cards">
              {singleFamilyCount > 0 && (
                <div className="value-card">
                  <div className="value-card-header">SINGLE FAMILY</div>
                  <div className="value-card-content">
                    <div className="value-total">{formatCurrency(singleFamilyValue)}</div>
                    <div className="value-details">
                      <span className="value-average">Average: {formatCurrency(singleFamilyAvg)}</span>
                      <span className="value-count">{formatNumber(singleFamilyCount)} sales</span>
                    </div>
                  </div>
                </div>
              )}
              {townhomeCount > 0 && (
                <div className="value-card">
                  <div className="value-card-header">TOWNHOME</div>
                  <div className="value-card-content">
                    <div className="value-total">{formatCurrency(townhomeValue)}</div>
                    <div className="value-details">
                      <span className="value-average">Average: {formatCurrency(townhomeAvg)}</span>
                      <span className="value-count">{formatNumber(townhomeCount)} sales</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridSalesModal;

