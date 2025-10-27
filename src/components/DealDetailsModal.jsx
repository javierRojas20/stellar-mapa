import React from 'react';

const DealDetailsModal = ({ deal, isOpen, onClose, loading = false }) => {
  if (!isOpen || !deal) return null;

  // Determinar el título y subtítulo basado en la categoría
  const getModalTitle = () => {
    if (deal.category === 'schools') {
      return {
        title: 'School Details',
        subtitle: deal.dealName || deal.name || 'School Information'
      };
    }
    if (deal.category === 'subdivisions') {
      return {
        title: 'Subdivision Details',
        subtitle: deal.dealName || deal.name || 'Subdivision Information'
      };
    }
    if (deal.category === 'masterPlans') {
      return {
        title: 'Masterplan Details',
        subtitle: deal.dealName || deal.name || 'Masterplan Information'
      };
    }
    if (deal.category === 'publixLocations') {
      return {
        title: 'Publix Details',
        subtitle: deal.dealName || deal.name || 'Publix Location'
      };
    }
    if (deal.category === 'healthcareFacilities') {
      return {
        title: 'Hospital Details',
        subtitle: deal.dealName || deal.name || 'Hospital Information'
      };
    }
    if (deal.category === 'hospitals' || deal.category === 6 || deal.categoryId === 6) {
      return {
        title: 'Hospital Details',
        subtitle: deal.name || deal.dealName || 'Hospital Information'
      };
    }
    // Para otras categorías, mantener el diseño original
    return {
      title: 'Subdivision Details',
      subtitle: 'Harmony/Cherry Hill'
    };
  };

  const { title, subtitle } = getModalTitle();

  return (
    <div className="deal-details-modal-overlay" onClick={onClose}>
      <div className="deal-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`deal-details-header ${deal.category === 'schools' ? 'school-header' : deal.category === 'subdivisions' ? 'subdivision-header' : deal.category === 'masterPlans' ? 'masterplan-header' : deal.category === 'publixLocations' ? 'publix-header' : deal.category === 'healthcareFacilities' ? 'hospital-header' : deal.category === 'hospitals' || deal.category === 6 || deal.categoryId === 6 ? 'hospital-header' : ''}`}>
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
              <div>Loading hospital details...</div>
            </div>
          )}
          
          {deal.category === 'schools' ? (
            // Contenido específico para Schools con el diseño de la imagen
            <>
              {/* School Name Card */}
              <div className="info-card school-name-card">
                <div className="card-icon school-name-icon" style={{ color: '#3b82f6' }}>🎓</div>
                <div className="card-content">
                  <span className="card-label">School Name</span>
                  <span className="card-value">{deal.dealName || deal.name || 'N/A'}</span>
                </div>
              </div>

              {/* School Type Card */}
              <div className="info-card school-type-card">
                <div className="card-icon school-type-icon" style={{ color: '#8b5cf6' }}>📖</div>
                <div className="card-content">
                  <span className="card-label">SCHOOL TYPE</span>
                  <span className="card-value school-type-value" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{deal.type || deal.school_type || 'N/A'}</span>
                </div>
              </div>

              {/* Address Card */}
              <div className="info-card school-address-card">
                <div className="card-icon school-address-icon" style={{ color: '#ef4444' }}>📍</div>
                <div className="card-content">
                  <span className="card-label">ADDRESS</span>
                  <span className="card-value">{deal.address || 'N/A'}</span>
                </div>
              </div>

              {/* School District Card */}
              <div className="info-card school-district-card">
                <div className="card-icon school-district-icon" style={{ color: '#059669' }}>🏛️</div>
                <div className="card-content">
                  <span className="card-label">SCHOOL DISTRICT</span>
                  <span className="card-value">{deal.district || deal.school_district || 'N/A'}</span>
                </div>
              </div>

              {/* Grade Level Card */}
              <div className="info-card school-grade-card">
                <div className="card-icon school-grade-icon" style={{ color: '#dc2626' }}>📚</div>
                <div className="card-content">
                  <span className="card-label">GRADE LEVEL</span>
                  <span className="card-value">{deal.grade_level || deal.grades || 'N/A'}</span>
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="info-card school-enrollment-card">
                <div className="card-icon school-enrollment-icon" style={{ color: '#7c3aed' }}>👥</div>
                <div className="card-content">
                  <span className="card-label">ENROLLMENT</span>
                  <span className="card-value">{deal.enrollment || deal.student_count || 'N/A'}</span>
                </div>
              </div>

              {/* Phone Card */}
              <div className="info-card school-phone-card">
                <div className="card-icon school-phone-icon" style={{ color: '#ea580c' }}>📞</div>
                <div className="card-content">
                  <span className="card-label">PHONE</span>
                  <span className="card-value">{deal.phone || deal.phone_number || 'N/A'}</span>
                </div>
              </div>

              {/* Website Card */}
              <div className="info-card school-website-card">
                <div className="card-icon school-website-icon" style={{ color: '#2563eb' }}>🌐</div>
                <div className="card-content">
                  <span className="card-label">WEBSITE</span>
                  <span className="card-value">{deal.website || deal.url || 'N/A'}</span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="summary-section">
                <h3 className="summary-title">Summary</h3>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">School Name</span>
                    <span className="summary-value">{deal.dealName || deal.name || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Type</span>
                    <span className="summary-value">{deal.type || deal.school_type || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Address</span>
                    <span className="summary-value">{deal.address || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">District</span>
                    <span className="summary-value">{deal.district || deal.school_district || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : deal.category === 'subdivisions' ? (
            // Contenido específico para Subdivisions
            <>
              {/* Subdivision Name Card */}
              <div className="info-card subdivision-name-card">
                <div className="card-icon subdivision-name-icon">🏠</div>
                <div className="card-content">
                  <span className="card-label">Subdivision</span>
                  <span className="card-value">{deal.dealName || deal.name || 'N/A'}</span>
                </div>
              </div>

              {/* Developer Card */}
              <div className="info-card developer-card">
                <div className="card-icon developer-icon">🏢</div>
                <div className="card-content">
                  <span className="card-label">Developer</span>
                  <span className="card-value">{deal.developer || 'N/A'}</span>
                </div>
              </div>

              {/* Product Type Card */}
              <div className="info-card product-type-card">
                <div className="card-icon product-type-icon">🏠</div>
                <div className="card-content">
                  <span className="card-label">Product Type</span>
                  <span className="card-value">{deal.product_type || deal.product || 'N/A'}</span>
                </div>
              </div>

              {/* Status Card */}
              <div className="info-card status-card">
                <div className="card-icon status-icon">✅</div>
                <div className="card-content">
                  <span className="card-label">Status</span>
                  <span className="card-value">{deal.status || 'N/A'}</span>
                </div>
              </div>

              {/* City Card */}
              <div className="info-card city-card">
                <div className="card-icon city-icon">📍</div>
                <div className="card-content">
                  <span className="card-label">City</span>
                  <span className="card-value">{deal.city || 'N/A'}</span>
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
                      <span className="lot-value">{deal.minimum_lot_width || 'N/A'}</span>
                    </div>
                    <div className="lot-max">
                      <span className="lot-label">Maximum</span>
                      <span className="lot-value">{deal.maximum_lot_width || 'N/A'}</span>
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
                      <span className="price-value">{deal.price_min || 'N/A'}</span>
                    </div>
                    <div className="price-max">
                      <span className="price-label">Maximum</span>
                      <span className="price-value">{deal.price_max || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Planned Card */}
              <div className="info-card units-card">
                <div className="card-icon units-icon">👥</div>
                <div className="card-content">
                  <span className="card-label">Units Planned</span>
                  <span className="card-value units-value">{deal.units_planned || deal.units || 'N/A'}</span>
                </div>
              </div>
            </>
          ) : deal.category === 'masterPlans' ? (
            // Contenido específico para Masterplans
            <>
              {/* Developer Card */}
              <div className="info-card developer-card">
                <div className="card-icon developer-icon">🏢</div>
                <div className="card-content">
                  <span className="card-label">DEVELOPER</span>
                  <span className="card-value">{deal.developer || 'N/A'}</span>
                </div>
              </div>

              {/* Status Card */}
              <div className="info-card status-card">
                <div className="card-icon status-icon">✅</div>
                <div className="card-content">
                  <span className="card-label">Status</span>
                  <span className="card-value">{deal.status || 'N/A'}</span>
                </div>
              </div>

              {/* County / City Cards */}
              <div className="two-column-grid">
                <div className="info-card county-card">
                  <div className="card-icon county-icon">📍</div>
                  <div className="card-content">
                    <span className="card-label">COUNTY</span>
                    <span className="card-value">{deal.county || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-card city-card">
                  <div className="card-icon city-icon">📍</div>
                  <div className="card-content">
                    <span className="card-label">CITY</span>
                    <span className="card-value">{deal.city || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Price Range Card */}
              <div className="info-card price-range-card">
                <div className="card-icon price-icon">$</div>
                <div className="card-content">
                  <span className="card-label">PRICE RANGE</span>
                  <div className="price-range-values">
                    <div className="price-min">
                      <span className="price-label">Minimum</span>
                      <span className="price-value">{deal.price_min || 'N/A'}</span>
                    </div>
                    <div className="price-max">
                      <span className="price-label">Maximum</span>
                      <span className="price-value">{deal.price_max || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Card */}
              <div className="info-card units-card">
                <div className="card-icon units-icon">👥</div>
                <div className="card-content">
                  <span className="card-label">UNITS</span>
                  <div className="units-progress">
                    <div className="units-sold">
                      <span className="units-sold-text">Sold</span>
                      <span className="units-sold-value">{deal.total_units_sold || '0'}</span>
                    </div>
                    <div className="units-progress-bar">
                      <div className="units-progress-fill" style={{width: `${deal.total_units_sold && deal.total_units_planned ? (deal.total_units_sold / deal.total_units_planned * 100) : 0}%`}}></div>
                    </div>
                    <div className="units-total">
                      <span className="units-total-value">{deal.total_units_sold || '0'} / {deal.total_units_planned || '0'}</span>
                      <span className="units-percentage">{deal.total_units_sold && deal.total_units_planned ? Math.round(deal.total_units_sold / deal.total_units_planned * 100) : 0}% sold</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="info-card timeline-card">
                <div className="card-icon timeline-icon">📅</div>
                <div className="card-content">
                  <span className="card-label">TIMELINE</span>
                  <div className="timeline-values">
                    <div className="timeline-opened">
                      <span className="timeline-label">Opened</span>
                      <span className="timeline-value">{deal.date_opened || 'N/A'}</span>
                    </div>
                    <div className="timeline-sold-out">
                      <span className="timeline-label">Sold Out</span>
                      <span className="timeline-value">{deal.date_sold_out || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acreage Section */}
              <div className="acreage-section">
                <div className="acreage-header">
                  <div className="acreage-icon">📐</div>
                  <span className="acreage-label">ACREAGE</span>
                </div>
                <div className="acreage-value">{deal.acreage || 'N/A'}</div>
              </div>

              {/* Summary Section */}
              <div className="summary-section">
                <div className="summary-title">Summary</div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Name</span>
                    <span className="summary-value">{deal.dealName || deal.name || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Developer</span>
                    <span className="summary-value">{deal.developer || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Status</span>
                    <span className="summary-value">{deal.status || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Location</span>
                    <span className="summary-value">{deal.city && deal.county ? `${deal.city}, ${deal.county}` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : deal.category === 'publixLocations' ? (
            // Contenido específico para Publix
            <>
              {/* Address Card */}
              <div className="info-card publix-address-card">
                <div className="card-icon publix-address-icon">📍</div>
                <div className="card-content">
                  <span className="card-label">ADDRESS</span>
                  <span className="card-value">{deal.address || 'N/A'}</span>
                </div>
              </div>
            </>
          ) : deal.category === 'healthcareFacilities' || deal.category === 'hospitals' || deal.category === 6 || deal.categoryId === 6 ? (
            // Contenido específico para Hospitals
            <>
              {/* Hospital Name Card */}
              <div className="info-card hospital-name-card">
                <div className="card-icon hospital-name-icon" style={{ color: '#e91e63' }}>❤️</div>
                <div className="card-content">
                  <span className="card-label">HOSPITAL NAME</span>
                  <span className="card-value">{deal.name || deal.dealName || 'N/A'}</span>
                </div>
              </div>

              {/* Address Card */}
              <div className="info-card hospital-address-card">
                <div className="card-icon hospital-address-icon" style={{ color: '#f44336' }}>📍</div>
                <div className="card-content">
                  <span className="card-label">ADDRESS</span>
                  <span className="card-value">{deal.address || 'N/A'}</span>
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
                  <span className="card-value">{deal.leapfrog_grade || deal.grade || deal.rating || 'N/A'}</span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="summary-section">
                <h3 className="summary-title">Summary</h3>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Hospital Name</span>
                    <span className="summary-value">{deal.name || deal.dealName || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Address</span>
                    <span className="summary-value">{deal.address || 'N/A'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Leapfrog Grade</span>
                    <span className="summary-value">{deal.leapfrog_grade || deal.grade || deal.rating || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Contenido original para otras categorías
            <>
              {/* Subdivision Card */}
              <div className="info-card subdivision-card">
                <div className="card-icon subdivision-icon">🏠</div>
                <div className="card-content">
                  <span className="card-label">Subdivision</span>
                  <span className="card-value">Harmony/Cherry Hill</span>
                </div>
              </div>

              {/* Developer Card */}
              <div className="info-card developer-card">
                <div className="card-icon developer-icon">🏢</div>
                <div className="card-content">
                  <span className="card-label">DEVELOPER</span>
                  <span className="card-value">Harmony Development Company</span>
                </div>
              </div>

              {/* Product / City Cards */}
              <div className="two-column-grid">
                <div className="info-card product-card">
                  <div className="card-icon product-icon">🏠</div>
                  <div className="card-content">
                    <span className="card-label">PRODUCT</span>
                    <span className="card-value">Single Family</span>
                  </div>
                </div>
                <div className="info-card city-card">
                  <div className="card-icon city-icon">📍</div>
                  <div className="card-content">
                    <span className="card-label">CITY</span>
                    <span className="card-value">St Cloud</span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="info-card status-card">
                <div className="card-icon status-icon">✅</div>
                <div className="card-content">
                  <span className="card-label">Status</span>
                  <span className="card-value">Built Out</span>
                </div>
              </div>

              {/* Price Range Card */}
              <div className="info-card price-range-card">
                <div className="card-icon price-icon">$</div>
                <div className="card-content">
                  <span className="card-label">PRICE RANGE</span>
                  <div className="price-range-values">
                    <div className="price-min">
                      <span className="price-label">Minimum</span>
                      <span className="price-value">$240,000</span>
                    </div>
                    <div className="price-max">
                      <span className="price-label">Maximum</span>
                      <span className="price-value">$517,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lot Width Card */}
              <div className="info-card lot-width-card">
                <div className="card-icon lot-icon">📏</div>
                <div className="card-content">
                  <span className="card-label">LOT WIDTH</span>
                  <div className="lot-width-values">
                    <div className="lot-min">
                      <span className="lot-label">Minimum</span>
                      <span className="lot-value">91 ft</span>
                    </div>
                    <div className="lot-max">
                      <span className="lot-label">Maximum</span>
                      <span className="lot-value">95 ft</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Units Planned Card */}
              <div className="info-card units-card">
                <div className="card-icon units-icon">👥</div>
                <div className="card-content">
                  <span className="card-label">UNITS PLANNED</span>
                  <span className="card-value units-value">342</span>
                </div>
              </div>

              {/* Acreage Section */}
              <div className="acreage-section">
                <div className="acreage-header">
                  <div className="acreage-icon">📐</div>
                  <span className="acreage-label">ACREAGE</span>
                </div>
                <div className="acreage-value">11,000 acres</div>
              </div>

              {/* Summary Section */}
              <div className="summary-section">
                <div className="summary-title">Summary</div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Name</span>
                    <span className="summary-value">Harmony</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Developer</span>
                    <span className="summary-value">Sun Terra Communities</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Status</span>
                    <span className="summary-value">Active</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Location</span>
                    <span className="summary-value">Harmony, Osceola County</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailsModal;