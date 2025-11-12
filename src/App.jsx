import React, { useState, useEffect, useRef } from 'react';
import stellarLogo from './assets/stellar-communities-logo.svg';
import MapboxMap from './components/MapboxMap';
import CategoryModalManager from './components/CategoryModalManager';
import AddressSearch from './components/AddressSearch';
import { useSupabase } from './hooks/useSupabase';
import { useCategories } from './hooks/useCategories';
import { useCategoryData } from './hooks/useCategoryData';
import { usePipelineFilters } from './hooks/usePipelineFilters';
import { usePipelineData } from './hooks/usePipelineData';
import { usePriceHeatmap } from './hooks/usePriceHeatmap';
import { useCountHeatmap } from './hooks/useCountHeatmap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import { testTableAccess, testCommonTables, addSampleHospitals, testTableWithSchema, createHospitalsCategory, getHospitalById, getItemDetailsById } from './services/dataLoader';
import './App.css';
import GridSalesModal from './components/GridSalesModal';

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
  
  // Estados para Grid Sales Modal
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridData, setGridData] = useState(null);
  const [gridLoading, setGridLoading] = useState(false);
  
  const [layers, setLayers] = useState({
    'stellar-pipeline': true
  });

  // Obtener filtros solo cuando el switch esté activo
  const isPipelineActive = layers['stellar-pipeline'] || false;
  const { statuses, products, loading: filtersLoading, error: filtersError } = usePipelineFilters(isPipelineActive);
  
  // Estados para los valores seleccionados en los selects
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Estados para Radius Analysis
  const [showRadiusAnalysis, setShowRadiusAnalysis] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(1);
  const [radiusValue, setRadiusValue] = useState(1609); // 1 mile in meters

  // Estados para Price Heatmap
  const [showPriceHeatmap, setShowPriceHeatmap] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null); // null = todos, o un rango específico
  
  // Estados para Count Heatmap
  const [showCountHeatmap, setShowCountHeatmap] = useState(false);
  const [selectedCountRange, setSelectedCountRange] = useState(null); // null = todos, o un rango específico

  // Estados para Wetlands
  const [showWetlands, setShowWetlands] = useState(false);

  // Estados para bounds del mapa (para heatmap)
  const [mapBounds, setMapBounds] = useState(null);
  
  // Referencia al mapa para controlarlo desde fuera
  const mapRef = useRef(null);
  
  // Función para manejar la selección de una ubicación desde la búsqueda
  const handleLocationSelect = (location) => {
    if (mapRef.current) {
      // Si hay bbox, usarlo para hacer zoom al área
      // El bbox viene como [minLng, minLat, maxLng, maxLat]
      if (location.bbox && Array.isArray(location.bbox) && location.bbox.length === 4) {
        mapRef.current.fitBounds(
          [[location.bbox[0], location.bbox[1]], [location.bbox[2], location.bbox[3]]],
          {
            padding: 50,
            maxZoom: 15
          }
        );
      } else {
        // Si no hay bbox, hacer zoom a las coordenadas
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 15,
          duration: 1500
        });
      }
    }
  };
  
  // Cargar datos de stellar_pipeline con filtros
  const { data: pipelineData, loading: pipelineDataLoading } = usePipelineData(
    isPipelineActive,
    selectedProduct,
    selectedStatus
  );

  // Cargar datos del heatmap de precios
  const { data: priceHeatmapData, loading: priceHeatmapLoading } = usePriceHeatmap(
    showPriceHeatmap,
    mapBounds,
    1000
  );

  // Cargar datos del heatmap de conteo
  const { data: countHeatmapData, loading: countHeatmapLoading } = useCountHeatmap(
    showCountHeatmap,
    mapBounds,
    1000
  );

  // Filtrar datos del heatmap según el rango seleccionado (nuevos rangos)
  const filteredHeatmapData = React.useMemo(() => {
    if (!priceHeatmapData || !priceHeatmapData.features || !selectedPriceRange) {
      return priceHeatmapData;
    }

    const filteredFeatures = priceHeatmapData.features.filter(feature => {
      const price = feature.properties?.avg_price || feature.properties?.price || 0;
      
      switch (selectedPriceRange) {
        case 'under200k':
          return price > 0 && price < 200000;
        case 'twoToThree':
          return price >= 200000 && price < 350000;
        case 'threeToFour':
          return price >= 350000 && price < 400000;
        case 'fourToSix':
          return price >= 400000 && price < 600000;
        case 'sixToSeven':
          return price >= 600000 && price < 700000;
        case 'over700k':
          return price >= 700000;
        default:
          return true;
      }
    });

    return {
      ...priceHeatmapData,
      features: filteredFeatures
    };
  }, [priceHeatmapData, selectedPriceRange]);

  // Filtrar datos del count heatmap según el rango seleccionado (usando sales_count)
  const filteredCountHeatmapData = React.useMemo(() => {
    if (!countHeatmapData || !countHeatmapData.features || !selectedCountRange) {
      return countHeatmapData;
    }

    const filteredFeatures = countHeatmapData.features.filter(feature => {
      const salesCount = feature.properties?.sales_count || feature.properties?.count || 0;
      
      switch (selectedCountRange) {
        case 'belowAverage':
          return salesCount < 35;
        case 'average':
          return salesCount === 35;
        case 'aboveMean':
          return salesCount > 35;
        default:
          return true;
      }
    });

    return {
      ...countHeatmapData,
      features: filteredFeatures
    };
  }, [countHeatmapData, selectedCountRange]);

  // Limpiar filtros cuando se desactiva el switch
  useEffect(() => {
    if (!isPipelineActive) {
      setSelectedProduct('');
      setSelectedStatus('');
    }
  }, [isPipelineActive]);

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
    
    // Si es un click en un grid del heatmap, mostrar modal de grid sales
    if (dealData.category === 'grid_sales' || dealData.grid_id) {
      const gridId = dealData.grid_id || dealData.id;
      console.log(`🖱️ Grid clicked, using data from heatmap for grid_id:`, gridId);
      console.log(`📊 Available grid data:`, dealData);
      
      // Los datos del grid ya vienen en las propiedades del feature del GeoJSON
      // No necesitamos hacer otra consulta, usamos los datos que ya tenemos
      setShowGridModal(true);
      setGridLoading(false); // No hay carga, los datos ya están
      
      // Preparar los datos del grid con los valores disponibles
      setGridData({
        grid_id: gridId,
        avg_price: dealData.avg_price || dealData.price || 0,
        sales_count: dealData.sales_count || dealData.total_sales || 0,
        sales_count_single_family: dealData.sales_count_single_family || dealData.single_family_count || 0,
        sales_count_townhome: dealData.sales_count_townhome || dealData.townhome_count || 0,
        sales_count_condominium: dealData.sales_count_condominium || dealData.condominium_count || 0,
        price_change_percent: dealData.price_change_percent || dealData.price_change || 0,
        // Intentar calcular valores si no están disponibles
        single_family_value: dealData.single_family_value || (dealData.avg_price * (dealData.sales_count_single_family || 0)),
        townhome_value: dealData.townhome_value || (dealData.avg_price * (dealData.sales_count_townhome || 0)),
        total_sales: dealData.sales_count || dealData.total_sales || 0,
        ...dealData
      });
      return;
    }
    
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
  
  const handleCloseGridModal = () => {
    setShowGridModal(false);
    setGridData(null);
    setGridLoading(false);
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

  // Función para alternar Price Heatmap
  const togglePriceHeatmap = () => {
    const newValue = !showPriceHeatmap;
    setShowPriceHeatmap(newValue);
    // Limpiar filtro cuando se desactiva el heatmap
    if (!newValue) {
      setSelectedPriceRange(null);
    }
  };

  // Función para calcular estadísticas del heatmap con nuevos rangos
  const getHeatmapStats = () => {
    if (!priceHeatmapData || !priceHeatmapData.features || priceHeatmapData.features.length === 0) {
      return {
        hasData: false,
        totalGrids: 0,
        ranges: {
          under200k: 0,    // Under $200K
          twoToThree: 0,   // $200K - $350K
          threeToFour: 0,  // $350K - $400K
          fourToSix: 0,    // $400K - $600K
          sixToSeven: 0,   // $600K - $700K
          over700k: 0     // $700K+
        },
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0
      };
    }

    const features = priceHeatmapData.features;
    let under200k = 0, twoToThree = 0, threeToFour = 0, fourToSix = 0, sixToSeven = 0, over700k = 0;
    let totalPrice = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    let validPrices = 0;

    features.forEach(feature => {
      const price = feature.properties?.avg_price || feature.properties?.price || 0;
      
      if (price > 0) {
        validPrices++;
        totalPrice += price;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);

        if (price < 200000) {
          under200k++;
        } else if (price < 350000) {
          twoToThree++;
        } else if (price < 400000) {
          threeToFour++;
        } else if (price < 600000) {
          fourToSix++;
        } else if (price < 700000) {
          sixToSeven++;
        } else {
          over700k++;
        }
      }
    });

    return {
      hasData: validPrices > 0,
      totalGrids: features.length,
      validGrids: validPrices,
      ranges: {
        under200k,
        twoToThree,
        threeToFour,
        fourToSix,
        sixToSeven,
        over700k
      },
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      avgPrice: validPrices > 0 ? totalPrice / validPrices : 0
    };
  };

  const heatmapStats = getHeatmapStats();

  // Función para alternar Count Heatmap
  const toggleCountHeatmap = () => {
    const newValue = !showCountHeatmap;
    setShowCountHeatmap(newValue);
    // Limpiar filtro cuando se desactiva el heatmap
    if (!newValue) {
      setSelectedCountRange(null);
    }
  };

  // Función para alternar Wetlands
  const toggleWetlands = () => {
    setShowWetlands(!showWetlands);
  };

  // Función para calcular estadísticas del count heatmap (3 rangos)
  const getCountHeatmapStats = () => {
    if (!countHeatmapData || !countHeatmapData.features || countHeatmapData.features.length === 0) {
      return {
        hasData: false,
        totalGrids: 0,
        ranges: {
          belowAverage: 0,  // < 35
          average: 0,       // = 35
          aboveMean: 0      // > 35
        },
        minCount: 0,
        maxCount: 0,
        avgCount: 0
      };
    }

    const features = countHeatmapData.features;
    let belowAverage = 0, average = 0, aboveMean = 0;
    let totalCount = 0;
    let minCount = Infinity;
    let maxCount = 0;
    let validCounts = 0;

    features.forEach(feature => {
      const count = feature.properties?.sales_count || feature.properties?.count || 0;
      
      if (count > 0) {
        validCounts++;
        totalCount += count;
        minCount = Math.min(minCount, count);
        maxCount = Math.max(maxCount, count);

        if (count < 35) {
          belowAverage++;
        } else if (count === 35) {
          average++;
        } else {
          aboveMean++;
        }
      }
    });

    return {
      hasData: validCounts > 0,
      totalGrids: features.length,
      validGrids: validCounts,
      ranges: {
        belowAverage,
        average,
        aboveMean
      },
      minCount: minCount === Infinity ? 0 : minCount,
      maxCount,
      avgCount: validCounts > 0 ? totalCount / validCounts : 0
    };
  };

  const countHeatmapStats = getCountHeatmapStats();

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
            <AddressSearch 
              onLocationSelect={handleLocationSelect}
            />
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <span className="help-text">Help & Support</span>
              <div className="status-indicator">
                <div className="status-dot connected"></div>
              </div>
              <div className="dropdown-container">
                <div 
                  className="user-profile-header" 
                  onClick={toggleDropdown}
                >
                  <button className="menu-btn">
                    {user.email?.charAt(0).toUpperCase() || 'M'}
                  </button>
                  <div className="user-info-header">
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
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
                <div 
                  className={`toggle ${layers['stellar-pipeline'] ? 'active' : ''}`}
                  onClick={() => toggleLayer('stellar-pipeline')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>

            {/* Pipeline Filters */}
            {layers['stellar-pipeline'] && (
              <div className="filters-section">
                <h3>Pipeline Filters</h3>
                <div className="filter-group">
                  <label>Product</label>
                  <select 
                    className="filter-dropdown" 
                    disabled={filtersLoading || products.length === 0}
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    {filtersLoading ? (
                      <option>Cargando productos...</option>
                    ) : products.length === 0 ? (
                      <option>No hay productos disponibles</option>
                    ) : (
                      products.map((product, index) => (
                        <option key={index} value={product === 'All Products' ? '' : product}>
                          {product}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select 
                    className="filter-dropdown" 
                    disabled={filtersLoading || statuses.length === 0}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {filtersLoading ? (
                      <option>Cargando estados...</option>
                    ) : statuses.length === 0 ? (
                      <option>No hay estados disponibles</option>
                    ) : (
                      statuses.map((status, index) => (
                        <option key={index} value={status === 'All Statuses' ? '' : status}>
                          {status}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

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

            {/* Price Heatmap Card */}
            <div className="heatmap-card">
              <div className="heatmap-header" onClick={togglePriceHeatmap}>
                <div className="heatmap-icon-dot"></div>
                <div className="heatmap-icon-graph">📈</div>
                <span className="heatmap-text">Price Heatmap (1-mile)</span>
                <div className={`toggle ${showPriceHeatmap ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              {showPriceHeatmap && (
                <div className="heatmap-content">
                  <label className="heatmap-label">Sale Price</label>
                  <div className="heatmap-gradient-container">
                    <div className="heatmap-gradient">
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'under200k' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'under200k' ? null : 'under200k');
                        }}
                        title="Under $200K"
                        style={{ backgroundColor: '#E53935' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'twoToThree' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'twoToThree' ? null : 'twoToThree');
                        }}
                        title="$200K - $350K"
                        style={{ backgroundColor: '#FFC107' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'threeToFour' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'threeToFour' ? null : 'threeToFour');
                        }}
                        title="$350K - $400K"
                        style={{ backgroundColor: '#FB8C00' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'fourToSix' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'fourToSix' ? null : 'fourToSix');
                        }}
                        title="$400K - $600K"
                        style={{ backgroundColor: '#7E57C2' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'sixToSeven' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'sixToSeven' ? null : 'sixToSeven');
                        }}
                        title="$600K - $700K"
                        style={{ backgroundColor: '#4285F4' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'over700k' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'over700k' ? null : 'over700k');
                        }}
                        title="$700K+"
                        style={{ backgroundColor: '#9E9E9E' }}
                      ></div>
                    </div>
                    <div className="heatmap-labels">
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'under200k' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'under200k' ? null : 'under200k')}
                        title="Under $200K"
                      >&lt;$200K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'twoToThree' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'twoToThree' ? null : 'twoToThree')}
                        title="$200K - $350K"
                      >$200-350K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'threeToFour' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'threeToFour' ? null : 'threeToFour')}
                        title="$350K - $400K"
                      >$350-400K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'fourToSix' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'fourToSix' ? null : 'fourToSix')}
                        title="$400K - $600K"
                      >$400-600K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'sixToSeven' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'sixToSeven' ? null : 'sixToSeven')}
                        title="$600K - $700K"
                      >$600-700K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'over700k' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'over700k' ? null : 'over700k')}
                        title="$700K+"
                      >$700K+</span>
                    </div>
                    {!heatmapStats.hasData && (
                      <span className="heatmap-no-data">No data</span>
                    )}
                    {heatmapStats.hasData && (
                      <div className="heatmap-stats">
                        <span className="heatmap-stat-text">
                          {heatmapStats.validGrids} grids • Avg: ${(heatmapStats.avgPrice / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Count Heatmap Card */}
            <div className="heatmap-card">
              <div className="heatmap-header" onClick={toggleCountHeatmap}>
                <div className="heatmap-icon-dot"></div>
                <span className="heatmap-text">Count Heatmap (1-mile)</span>
                <div className={`toggle ${showCountHeatmap ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              {showCountHeatmap && (
                <div className="heatmap-content">
                  <label className="heatmap-label">Count</label>
                  <div className="heatmap-gradient-container">
                    <div className="heatmap-gradient">
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'belowAverage' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'belowAverage' ? null : 'belowAverage');
                        }}
                        title="Debajo promedio"
                        style={{ backgroundColor: '#FFC107' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'average' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'average' ? null : 'average');
                        }}
                        title="Promedio (35 ventas)"
                        style={{ backgroundColor: '#22c55e' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'aboveMean' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'aboveMean' ? null : 'aboveMean');
                        }}
                        title="Above mean"
                        style={{ backgroundColor: '#4285F4' }}
                      ></div>
                    </div>
                    <div className="heatmap-labels count-heatmap-labels">
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'belowAverage' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'belowAverage' ? null : 'belowAverage');
                        }}
                        title="Debajo promedio"
                      >Debajo promedio</span>
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'average' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'average' ? null : 'average');
                        }}
                        title="Promedio (35 ventas)"
                      >Promedio (35)</span>
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'aboveMean' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'aboveMean' ? null : 'aboveMean');
                        }}
                        title="Above mean"
                      >Above mean</span>
                    </div>
                    {!countHeatmapStats.hasData && (
                      <span className="heatmap-no-data">No data</span>
                    )}
                    {countHeatmapStats.hasData && (
                      <div className="heatmap-stats" style={{marginTop: '5px !important'}}>
                        <span className="heatmap-stat-text">
                          {countHeatmapStats.validGrids} grids • Avg: {countHeatmapStats.avgCount.toFixed(1)} sales
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Wetlands Card */}
            <div className="wetlands-card">
              <div className="wetlands-header" onClick={toggleWetlands}>
                <div className="wetlands-icon-circle"></div>
                <div className="wetlands-icon-pin">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ff69b4"/>
                  </svg>
                </div>
                <span className="wetlands-text">Wetlands</span>
                <div className={`toggle ${showWetlands ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard">
        <div className="sidebar">
          <div className="sidebar-content">
            {/* Stellar Pipeline Card */}
            <div className="pipeline-card">
              <div className="pipeline-header">
                <div className="pipeline-icon">🚀</div>
                <span className="pipeline-title">Stellar Pipeline</span>
                <div 
                  className={`toggle ${layers['stellar-pipeline'] ? 'active' : ''}`}
                  onClick={() => toggleLayer('stellar-pipeline')}
                >
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>

            {/* Pipeline Filters */}
            {layers['stellar-pipeline'] && (
              <div className="filters-section">
                <h3>Pipeline Filters</h3>
                <div className="filter-group">
                  <label>Product</label>
                  <select 
                    className="filter-dropdown" 
                    disabled={filtersLoading || products.length === 0}
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    {filtersLoading ? (
                      <option>Cargando productos...</option>
                    ) : products.length === 0 ? (
                      <option>No hay productos disponibles</option>
                    ) : (
                      products.map((product, index) => (
                        <option key={index} value={product === 'All Products' ? '' : product}>
                          {product}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select 
                    className="filter-dropdown" 
                    disabled={filtersLoading || statuses.length === 0}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {filtersLoading ? (
                      <option>Cargando estados...</option>
                    ) : statuses.length === 0 ? (
                      <option>No hay estados disponibles</option>
                    ) : (
                      statuses.map((status, index) => (
                        <option key={index} value={status === 'All Statuses' ? '' : status}>
                          {status}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

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

            {/* Price Heatmap Card */}
            <div className="heatmap-card" style={{marginBottom: '16px'}}>
              <div className="heatmap-header" onClick={togglePriceHeatmap}>
                <div className="heatmap-icon-dot"></div>
                <span className="heatmap-text">Price Heatmap (1-mile)</span>
                <div className={`toggle ${showPriceHeatmap ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              {showPriceHeatmap && (
                <div className="heatmap-content">
                  <label className="heatmap-label">Sale Price</label>
                  <div className="heatmap-gradient-container">
                    <div className="heatmap-gradient">
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'under200k' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'under200k' ? null : 'under200k');
                        }}
                        title="Under $200K"
                        style={{ backgroundColor: '#E53935' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'twoToThree' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'twoToThree' ? null : 'twoToThree');
                        }}
                        title="$200K - $350K"
                        style={{ backgroundColor: '#FFC107' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'threeToFour' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'threeToFour' ? null : 'threeToFour');
                        }}
                        title="$350K - $400K"
                        style={{ backgroundColor: '#FB8C00' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'fourToSix' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'fourToSix' ? null : 'fourToSix');
                        }}
                        title="$400K - $600K"
                        style={{ backgroundColor: '#7E57C2' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'sixToSeven' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'sixToSeven' ? null : 'sixToSeven');
                        }}
                        title="$600K - $700K"
                        style={{ backgroundColor: '#4285F4' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedPriceRange === 'over700k' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPriceRange(selectedPriceRange === 'over700k' ? null : 'over700k');
                        }}
                        title="$700K+"
                        style={{ backgroundColor: '#9E9E9E' }}
                      ></div>
                    </div>
                    <div className="heatmap-labels">
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'under200k' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'under200k' ? null : 'under200k')}
                        title="Under $200K"
                      >&lt;$200K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'twoToThree' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'twoToThree' ? null : 'twoToThree')}
                        title="$200K - $350K"
                      >$200-350K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'threeToFour' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'threeToFour' ? null : 'threeToFour')}
                        title="$350K - $400K"
                      >$350-400K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'fourToSix' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'fourToSix' ? null : 'fourToSix')}
                        title="$400K - $600K"
                      >$400-600K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'sixToSeven' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'sixToSeven' ? null : 'sixToSeven')}
                        title="$600K - $700K"
                      >$600-700K</span>
                      <span 
                        className={`heatmap-label-price ${selectedPriceRange === 'over700k' ? 'active' : ''}`}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === 'over700k' ? null : 'over700k')}
                        title="$700K+"
                      >$700K+</span>
                    </div>
                    {!heatmapStats.hasData && (
                      <span className="heatmap-no-data">No data</span>
                    )}
                    {heatmapStats.hasData && (
                      <div className="heatmap-stats" style={{marginTop: '5px !important'}}>
                        <span className="heatmap-stat-text">
                          {heatmapStats.validGrids} grids • Avg: ${(heatmapStats.avgPrice / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Count Heatmap Card */}
            <div className="heatmap-card">
              <div className="heatmap-header" onClick={toggleCountHeatmap}>
                <div className="heatmap-icon-dot"></div>
                <span className="heatmap-text">Count Heatmap (1-mile)</span>
                <div className={`toggle ${showCountHeatmap ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
              {showCountHeatmap && (
                <div className="heatmap-content">
                  <label className="heatmap-label">Count</label>
                  <div className="heatmap-gradient-container">
                    <div className="heatmap-gradient">
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'belowAverage' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'belowAverage' ? null : 'belowAverage');
                        }}
                        title="Debajo promedio"
                        style={{ backgroundColor: '#FFC107' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'average' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'average' ? null : 'average');
                        }}
                        title="Promedio (35 ventas)"
                        style={{ backgroundColor: '#22c55e' }}
                      ></div>
                      <div 
                        className={`heatmap-range ${selectedCountRange === 'aboveMean' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'aboveMean' ? null : 'aboveMean');
                        }}
                        title="Above mean"
                        style={{ backgroundColor: '#4285F4' }}
                      ></div>
                    </div>
                    <div className="heatmap-labels count-heatmap-labels">
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'belowAverage' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'belowAverage' ? null : 'belowAverage');
                        }}
                        title="Debajo promedio"
                      >Debajo promedio</span>
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'average' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'average' ? null : 'average');
                        }}
                        title="Promedio (35 ventas)"
                      >Promedio (35)</span>
                      <span 
                        className={`heatmap-label-price ${selectedCountRange === 'aboveMean' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountRange(selectedCountRange === 'aboveMean' ? null : 'aboveMean');
                        }}
                        title="Above mean"
                      >Above mean</span>
                    </div>
                    {!countHeatmapStats.hasData && (
                      <span className="heatmap-no-data">No data</span>
                    )}
                    {countHeatmapStats.hasData && (
                      <div className="heatmap-stats" style={{marginTop: '5px !important'}}>
                        <span className="heatmap-stat-text">
                          {countHeatmapStats.validGrids} grids • Avg: {countHeatmapStats.avgCount.toFixed(1)} sales
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Wetlands Card */}
            <div className="wetlands-card">
              <div className="wetlands-header" onClick={toggleWetlands}>
                <div className="wetlands-icon-circle"></div>
                <div className="wetlands-icon-pin">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ff69b4"/>
                  </svg>
                </div>
                <span className="wetlands-text">Wetlands</span>
                <div className={`toggle ${showWetlands ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="map-container">
          <MapboxMap 
            ref={mapRef}
            onMarkerClick={handleMarkerClick}
            isRadiusMode={isRadiusMode}
            radiusValue={radiusValue}
            categoryData={getCategoryData}
            layers={layers}
            categories={categories}
            pipelineData={pipelineData}
            isPipelineActive={isPipelineActive}
            priceHeatmapData={filteredHeatmapData}
            showPriceHeatmap={showPriceHeatmap}
            countHeatmapData={filteredCountHeatmapData}
            showCountHeatmap={showCountHeatmap}
            showWetlands={showWetlands}
            onBoundsChange={setMapBounds}
          />

        {showDealModal && modalDeal && (
          <CategoryModalManager
            deal={modalDeal}
            isOpen={showDealModal}
            onClose={handleCloseModal}
            loading={modalLoading}
          />
        )}
        
        {showGridModal && (
          <GridSalesModal
            gridData={gridData}
            isOpen={showGridModal}
            onClose={handleCloseGridModal}
            loading={gridLoading}
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