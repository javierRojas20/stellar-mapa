import React, { useState, useEffect } from 'react';
import stellarLogo from './assets/stellar-communities-logo.svg';
import MapboxMap from './components/MapboxMap';
import CategoryModalManager from './components/CategoryModalManager';
import { useSupabase } from './hooks/useSupabase';
import { useCategories } from './hooks/useCategories';
import { useCategoryData } from './hooks/useCategoryData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import { testTableAccess, testCommonTables, addSampleHospitals, testTableWithSchema, createHospitalsCategory, getHospitalById, getItemDetailsById } from './services/dataLoader';
import './App.css';

// Componente principal de la aplicación
const AppContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { supabase, isSupabaseConnected, supabaseLoading, supabaseError } = useSupabase();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { loadCategoryData, clearCategoryData, getCategoryData, isLoading: isCategoryDataLoading, getError: getCategoryDataError } = useCategoryData();
  
  // Estados para el dashboard
  const [showDealModal, setShowDealModal] = useState(false);
  const [modalDeal, setModalDeal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [layers, setLayers] = useState({
    'stellar-pipeline': true
  });

  // Estados para Radius Analysis
  const [showRadiusAnalysis, setShowRadiusAnalysis] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(1);
  const [radiusValue, setRadiusValue] = useState(1609); // 1 mile in meters

  // Inicializar layers con las categorías de la base de datos
  useEffect(() => {
    if (categories.length > 0) {
      const initialLayers = { 'stellar-pipeline': true };
      categories.forEach(category => {
        initialLayers[category.id] = false;
      });
      setLayers(initialLayers);
    }
  }, [categories]);

  // Función para probar acceso a tablas
  const testTable = async (tableName) => {
    console.log(`🧪 Testing table: ${tableName}`);
    const result = await testTableAccess(tableName);
    console.log(`📋 Test result for ${tableName}:`, result);
    alert(`Test result for ${tableName}:\n${JSON.stringify(result, null, 2)}`);
  };

  // Función para probar todas las tablas comunes
  const testAllTables = async () => {
    console.log(`🧪 Testing all common tables...`);
    const results = await testCommonTables();
    console.log(`📋 All table results:`, results);
    
    const accessibleTables = Object.entries(results)
      .filter(([name, result]) => result.accessible)
      .map(([name, result]) => `${name} (${result.recordCount} records)`);
    
    alert(`Tables found:\n${accessibleTables.join('\n')}\n\nFull results in console.`);
  };

  // Función para agregar datos de prueba a hospitals
  const addHospitalsData = async () => {
    console.log(`🏥 Adding sample hospitals data...`);
    const result = await addSampleHospitals();
    console.log(`📋 Add hospitals result:`, result);
    
    if (result.success) {
      alert(`✅ Successfully added ${result.count} hospitals!\n\nCheck the console for details.`);
    } else {
      alert(`❌ Error adding hospitals:\n${result.error}\n\nCheck the console for details.`);
    }
  };

  // Función para probar con esquema explícito
  const testHospitalsWithSchema = async () => {
    console.log(`🧪 Testing hospitals with explicit schema...`);
    const result = await testTableWithSchema('hospitals', 'public');
    console.log(`📋 Test result with schema:`, result);
    alert(`Test result with schema:\n${JSON.stringify(result, null, 2)}`);
  };

  // Función para mostrar categorías disponibles y activar hospitales si existe
  const activateHospitalsLayer = async () => {
    console.log(`🏥 Checking available categories...`);
    console.log(`🏥 Available categories:`, categories);
    
    // Mostrar todas las categorías disponibles
    const categoriesInfo = categories.map(cat => `ID: ${cat.id} - ${cat.nombre} (${cat.slug})`).join('\n');
    console.log(`🏥 Categories info:\n${categoriesInfo}`);
    
    // Buscar si existe una categoría para hospitales
    const hospitalsCategory = categories.find(cat => 
      cat.slug === 'hospitals' || 
      cat.nombre.toLowerCase().includes('hospital') ||
      cat.nombre.toLowerCase().includes('healthcare')
    );
    
    if (hospitalsCategory) {
      console.log(`🏥 Found hospitals category:`, hospitalsCategory);
      
      // Cargar datos y activar la capa
      await loadCategoryData(hospitalsCategory.id, hospitalsCategory.slug);
      
      // Activar la capa
      setLayers(prev => ({
        ...prev,
        [hospitalsCategory.id]: true
      }));
      
      // Forzar actualización del mapa después de un pequeño delay
      setTimeout(() => {
        console.log(`🔄 Forcing map update for hospitals layer`);
        setLayers(prev => ({ ...prev }));
      }, 100);
      
      alert(`✅ Hospitals layer activated!\nCategory: ${hospitalsCategory.nombre}\nSlug: ${hospitalsCategory.slug}\nID: ${hospitalsCategory.id}`);
    } else {
      console.log(`🏥 No hospitals category found.`);
      alert(`❌ No hospitals category found.\n\nAvailable categories:\n${categoriesInfo}\n\nPlease ask the data team to create a "hospitals" category in the database.`);
    }
  };

  // Función de emergencia para forzar actualización del mapa
  const forceMapUpdate = () => {
    console.log(`🔄 Forcing map update...`);
    setLayers(prev => ({ ...prev }));
  };

  // Función para probar la modal con datos de hospital
  const testHospitalModal = () => {
    const testHospitalData = {
      id: 1, // ID real del hospital para probar la función RPC
      category: 'hospitals',
      categoryId: 6,
      name: 'Baptist Medical Center South',
      address: '14550 Saint Augustine Rd, Saint Agustine, 32258',
      latitude: 30.138,
      longitude: -81.535,
      rating: 4.5
    };
    
    console.log(`🏥 Testing hospital modal with data:`, testHospitalData);
    handleMarkerClick(testHospitalData);
  };

  // Debug: Mostrar datos cargados cuando cambien
  useEffect(() => {
    console.log('📊 Current category data:', getCategoryData);
    console.log('📊 Current layers state:', layers);
    console.log('📊 Current categories:', categories);
  }, [getCategoryData, layers, categories]);
  const [isRadiusMode, setIsRadiusMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Función para manejar clicks en marcadores
  const handleMarkerClick = async (dealData) => {
    console.log(`🖱️ Marker clicked:`, dealData);
    console.log(`🔍 DealData category:`, dealData.category);
    console.log(`🔍 DealData categoryId:`, dealData.categoryId);
    console.log(`🔍 Available categories:`, categories);
    
    // Debug: Mostrar información detallada de las categorías
    console.log(`🔍 Categories details:`, categories.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      slug: cat.slug
    })));
    
    // Mostrar modal inmediatamente con datos básicos
    setModalDeal(dealData);
    setShowDealModal(true);
    
    // Cargar detalles completos para cualquier categoría que tenga RPC
    // Asegurar que category sea un string (slug) y no un número
    let categorySlug = dealData.category;
    
    // Si category es un número, buscar el slug correspondiente
    if (typeof categorySlug === 'number') {
      const categoryInfo = categories.find(cat => cat.id === categorySlug);
      categorySlug = categoryInfo?.slug || categorySlug;
      console.log(`🔍 Converted category ${dealData.category} to slug: ${categorySlug}`);
    }
    
    const itemId = dealData.id;
    
    if (categorySlug && itemId) {
      setModalLoading(true);
      
      try {
        console.log(`🔍 Loading ${categorySlug} details for ID: ${itemId}`);
        const result = await getItemDetailsById(categorySlug, itemId);
        
        if (result.success) {
          console.log(`✅ ${categorySlug} details loaded:`, result.data);
          setModalDeal({
            ...dealData,
            ...result.data, // Agregar todos los detalles del item
            category: categorySlug,
            categoryId: dealData.categoryId
          });
        } else {
          console.warn(`⚠️ Could not load ${categorySlug} details:`, result.error);
          // Mantener datos básicos si no se pueden cargar los detalles
        }
      } catch (error) {
        console.error(`💥 Error loading ${categorySlug} details:`, error);
        // Mantener datos básicos en caso de error
      } finally {
        setModalLoading(false);
      }
    }
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setShowDealModal(false);
    setModalDeal(null);
    setModalLoading(false);
  };

  // Función para toggle del dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Función para cerrar dropdown
  const closeDropdown = () => {
    setShowDropdown(false);
  };

  // Función para toggle del dropdown del usuario
  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // Función para cerrar dropdown del usuario
  const closeUserDropdown = () => {
    setShowUserDropdown(false);
  };

  // Función para toggle del menú móvil
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Función para cerrar menú móvil
  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        closeDropdown();
      }
      if (showUserDropdown && !event.target.closest('.user-dropdown-container')) {
        closeUserDropdown();
      }
      if (showMobileMenu && !event.target.closest('.mobile-menu-container')) {
        closeMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showUserDropdown, showMobileMenu]);

  // Función para alternar capas
  const toggleLayer = async (layerName) => {
    const newState = !layers[layerName];
    
    setLayers(prev => ({
      ...prev,
      [layerName]: newState
    }));

    // Si se está activando la capa, cargar datos
    if (newState) {
      // Buscar la categoría por ID
      const category = categories.find(cat => cat.id === layerName);
      if (category && category.slug) {
        console.log(`🔄 Activating layer: ${category.nombre} (${category.slug})`);
        console.log(`📋 Category details:`, category);
        await loadCategoryData(category.id, category.slug);
      } else {
        console.warn(`⚠️ Category not found or missing slug for layer: ${layerName}`);
        console.log('Available categories:', categories);
      }
    } else {
      // Si se está desactivando, limpiar datos
      const category = categories.find(cat => cat.id === layerName);
      if (category && category.slug) {
        console.log(`🔄 Deactivating layer: ${layerName} (${category.slug})`);
        clearCategoryData(category.slug);
      }
    }
    
    // Solo llamar a togglePipeline para pipelines estáticos, no para categorías dinámicas
    // Las categorías dinámicas se manejan automáticamente por el useEffect en MapboxMap
    if (window.togglePipeline && layerName !== 'stellar-pipeline') {
      // Verificar si es un pipeline estático (no una categoría de base de datos)
      const isStaticPipeline = ['masterPlans', 'healthcareFacilities', 'schools', 'retail', 'industrial'].includes(layerName);
      if (isStaticPipeline) {
        window.togglePipeline(layerName, newState);
      }
    }
  };

  // Función para alternar Radius Analysis
  const toggleRadiusAnalysis = () => {
    setShowRadiusAnalysis(!showRadiusAnalysis);
    setIsRadiusMode(!showRadiusAnalysis);
  };

  // Función para manejar cambio de radio
  const handleRadiusChange = (miles) => {
    setRadiusMiles(miles);
    setRadiusValue(miles * 1609.34); // Convertir millas a metros
  };

  // Función para manejar slider de radio
  const handleRadiusSliderChange = (e) => {
    const meters = parseInt(e.target.value);
    setRadiusValue(meters);
    setRadiusMiles(meters * 0.000621371); // Convertir metros a millas
  };

  // Mostrar loading mientras se carga la autenticación
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Mostrar pantalla de login si no hay usuario autenticado
  if (!user) {
    return <Auth />;
  }

  // Mostrar dashboard si el usuario está autenticado
  return (
    <div className="app">
      {/* Top Header Bar */}
      <div className="top-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
            >
              ☰
            </button>
            <img src={stellarLogo} alt="Stellar Communities" className="header-logo" />
          </div>
          
          <div className="header-center">
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input 
                type="text" 
                placeholder="Search for an address, parcel or saved site" 
                className="search-input"
              />
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button 
                onClick={testHospitalModal}
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '14px', 
                  backgroundColor: '#d4edda', 
                  border: '1px solid #28a745',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🏥 Test Modal
              </button>
              <span className="help-text">Help & Support</span>
              <div className="status-indicator">
                <div className="status-dot connected"></div>
              </div>
              <div className="dropdown-container">
              <p className="user-email">{user.email}</p>
                <button 
                  className="menu-btn dropdown-toggle" 
                  onClick={toggleDropdown}
                >
                  M
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">Settings</div>
                    <div className="dropdown-item">Help & Support</div>
                    <div className="dropdown-item" onClick={signOut}>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Mobile Menu */}
      <div className={`mobile-menu-container ${showMobileMenu ? 'active' : ''}`}>
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <img src={stellarLogo} alt="Stellar Communities" className="mobile-menu-logo" />
            <button className="mobile-menu-close" onClick={closeMobileMenu}>×</button>
          </div>
          
          <div className="mobile-menu-content">
            {/* Stellar Pipeline Card */}
            <div className="pipeline-card">
              <div className="pipeline-header">
                <div className="pipeline-icon">🚀</div>
                <span className="pipeline-title">Stellar Pipeline</span>
                <div className={`toggle ${layers['stellar-pipeline'] ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>

            {/* Pipeline Filters */}
            <div className="filters-section">
              <h3>Pipeline Filters</h3>
              <div className="filter-group">
                <label>Product</label>
                <select className="filter-dropdown">
                  <option>All Products</option>
                  <option>Single Family</option>
                  <option>Multi Family</option>
                  <option>Commercial</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select className="filter-dropdown">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            {/* Data Layers */}
            <div className="layers-section">
              <div className="layers-list">
                {categoriesLoading ? (
                  <div className="loading-text">Cargando categorías...</div>
                ) : categoriesError ? (
                  <div className="error-text">Error al cargar categorías: {categoriesError}</div>
                ) : (
                  categories.map(category => (
                    
                    <div key={category.id} className="layer-item">
                      <div className="layer-dot" style={{ backgroundColor: category.color || '#3b82f6' }}></div>
                      <div className="layer-icon" style={{ color: category.color || '#3b82f6' }}>
                        {category.icon || '📍'}
                      </div>
                      <span className="layer-name">{category.nombre}</span>
                      <div 
                        className={`toggle ${layers[category.id] ? 'active' : ''}`}
                        onClick={() => toggleLayer(category.id)}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Radius Analysis Card */}
            <div className="radius-card">
              <div className="radius-header" onClick={toggleRadiusAnalysis}>
                <div className="radius-icon">⭕</div>
                <span className="radius-text">Radius Analysis</span>
                <div className={`toggle ${showRadiusAnalysis ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              <p className="radius-subtitle">Data within the selected radius</p>
              
              {showRadiusAnalysis && (
                <div className="radius-controls">
                  <div className="radius-slider-container">
                    <label className="radius-slider-label">
                      Radius: {radiusValue >= 1000 ? `${(radiusValue / 1000).toFixed(1)}km` : `${radiusValue}m`} ({(radiusValue * 0.000621371).toFixed(1)} miles)
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000000"
                      step="1000"
                      value={radiusValue}
                      onChange={handleRadiusSliderChange}
                      className="radius-slider"
                    />
                    <div className="radius-slider-labels">
                      <span>100m</span>
                      <span>1000km</span>
                    </div>
                  </div>
                  <div className="radius-instructions">
                    Click on the map to draw radius circle
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard">
        <div className="sidebar">
          <div className="sidebar-tabs">
            <div className="tab active">Data Layers</div>
            <div className="tab">My Pipeline →</div>
          </div>

          <div className="sidebar-content">
            {/* Stellar Pipeline Card */}
            <div className="pipeline-card">
              <div className="pipeline-header">
                <div className="pipeline-icon">🚀</div>
                <span className="pipeline-title">Stellar Pipeline</span>
                <div className={`toggle ${layers['stellar-pipeline'] ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>

            {/* Pipeline Filters */}
            <div className="filters-section">
              <h3>Pipeline Filters</h3>
              <div className="filter-group">
                <label>Product</label>
                <select className="filter-dropdown">
                  <option>All Products</option>
                  <option>Single Family</option>
                  <option>Multi Family</option>
                  <option>Commercial</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select className="filter-dropdown">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>

            {/* Data Layers */}
            <div className="layers-section">
              <div className="layers-list">
                {categoriesLoading ? (
                  <div className="loading-text">Cargando categorías...</div>
                ) : categoriesError ? (
                  <div className="error-text">Error al cargar categorías: {categoriesError}</div>
                ) : (
                  categories.map(category => {
                    const isLoading = isCategoryDataLoading(category.slug);
                    const hasError = getCategoryDataError(category.slug);
                    
                    return (
                      <div key={category.id} className="layer-item">
                        <div className="layer-dot" style={{ backgroundColor: category.color || '#3b82f6' }}></div>
                        <div className="layer-icon" style={{ color: category.color || '#3b82f6' }}>
                          {category.icon || '📍'}
                        </div>
                        <span className="layer-name">
                          {category.nombre}
                          {isLoading && <span className="loading-indicator">⏳</span>}
                          {hasError && <span className="error-indicator">❌</span>}
                        </span>
                        <div 
                          className={`toggle ${layers[category.id] ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
                          onClick={() => !isLoading && toggleLayer(category.id)}
                        >
                          <div className="toggle-slider"></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Radius Analysis Card */}
            <div className="radius-card">
              <div className="radius-header" onClick={toggleRadiusAnalysis}>
                <div className="radius-icon">⭕</div>
                <span className="radius-text">Radius Analysis</span>
                <div className={`toggle ${showRadiusAnalysis ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              <p className="radius-subtitle">Data within the selected radius</p>
              
              {showRadiusAnalysis && (
                <div className="radius-controls">
                  <div className="radius-slider-container">
                    <label className="radius-slider-label">
                      Radius: {radiusValue >= 1000 ? `${(radiusValue / 1000).toFixed(1)}km` : `${radiusValue}m`} ({(radiusValue * 0.000621371).toFixed(1)} miles)
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000000"
                      step="1000"
                      value={radiusValue}
                      onChange={handleRadiusSliderChange}
                      className="radius-slider"
                    />
                    <div className="radius-slider-labels">
                      <span>100m</span>
                      <span>1000km</span>
                    </div>
                  </div>
                  <div className="radius-instructions">
                    Click on the map to draw radius circle
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="map-container">
          <MapboxMap 
            onMarkerClick={handleMarkerClick}
            isRadiusMode={isRadiusMode}
            radiusValue={radiusValue}
            categoryData={getCategoryData}
            layers={layers}
            categories={categories}
          />

        {showDealModal && modalDeal && (
          <CategoryModalManager
            deal={modalDeal}
            isOpen={showDealModal}
            onClose={handleCloseModal}
            loading={modalLoading}
          />
        )}
        </div>
      </div>
    </div>
  );
};

// Componente principal con AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;