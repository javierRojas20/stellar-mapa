import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

const MapboxMap = forwardRef(({ 
  showRadiusAnalysis, 
  radiusMiles, 
  onMarkerClick, 
  selectedDeal,
  isRadiusMode,
  radiusValue,
  categoryData,
  layers,
  categories,
  pipelineData = [],
  isPipelineActive = false,
  priceHeatmapData = null,
  showPriceHeatmap = false,
  countHeatmapData = null,
  showCountHeatmap = false,
  showWetlands = false,
  onBoundsChange = null
}, ref) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const initialized = useRef(false);
  const [activeLayers, setActiveLayers] = useState({});

  // Exponer métodos del mapa a través del ref
  useImperativeHandle(ref, () => ({
    flyTo: (options) => {
      if (map.current) {
        map.current.flyTo(options);
      }
    },
    fitBounds: (bounds, options) => {
      if (map.current) {
        map.current.fitBounds(bounds, options);
      }
    },
    getMap: () => map.current
  }), []);

  // Manejar datos de categorías cuando cambien
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('🔄 Updating map with category data:', { layers, categoryData, categories });

    // Limpiar capas existentes (primero las capas, luego las fuentes)
    Object.keys(activeLayers).forEach(layerId => {
      console.log(`🧹 Cleaning up layer: ${layerId}`);
      
      // Lista de capas a remover en orden
      const layersToRemove = [
        `${layerId}-clusters-count`,
        `${layerId}-clusters`,
        `${layerId}-unclustered-point`,
        `${layerId}-unclustered-point-text`
      ];
      
      // Remover capas una por una
      layersToRemove.forEach(layerName => {
        if (map.current.getLayer(layerName)) {
          try {
            map.current.removeLayer(layerName);
            console.log(`✅ Removed layer: ${layerName}`);
          } catch (error) {
            console.warn(`⚠️ Could not remove layer ${layerName}:`, error.message);
          }
        }
      });
      
      // Remover la fuente después de las capas
      if (map.current.getSource(`${layerId}-data`)) {
        try {
          map.current.removeSource(`${layerId}-data`);
          console.log(`✅ Removed source: ${layerId}-data`);
        } catch (error) {
          console.warn(`⚠️ Could not remove source ${layerId}-data:`, error.message);
        }
      }
    });

    // Agregar nuevas capas activas
    Object.entries(layers).forEach(([layerId, isActive]) => {
      if (isActive && layerId !== 'stellar-pipeline') {
        // Convertir layerId a número si es string
        const numericLayerId = typeof layerId === 'string' ? parseInt(layerId) : layerId;
        const category = categories.find(cat => cat.id === numericLayerId);
        console.log(`🔍 Processing layer ${layerId} (numeric: ${numericLayerId}):`, { category, isActive, categories });
        
        if (category) {
          const data = categoryData(category.slug);
          console.log(`📊 Data for ${category.slug}:`, data);
          
          if (data && data.length > 0) {
            console.log(`📍 Adding layer ${layerId} (${category.slug}) with ${data.length} items`);
            addCategoryLayer(category, data);
          } else {
            console.log(`⚠️ No data found for ${category.slug}`);
          }
        } else {
          console.log(`⚠️ Category not found for layer ${layerId}. Available categories:`, categories.map(c => ({ id: c.id, nombre: c.nombre, slug: c.slug })));
        }
      }
    });

    setActiveLayers({ ...layers });
  }, [layers, categoryData, categories, mapLoaded]);

  // Manejar markers de stellar_pipeline
  useEffect(() => {
    console.log('🔄 Pipeline markers effect triggered:', {
      mapExists: !!map.current,
      mapLoaded,
      isPipelineActive,
      pipelineDataLength: pipelineData?.length || 0,
      pipelineData: pipelineData
    });

    if (!map.current || !mapLoaded) {
      console.log('⏸️ Skipping pipeline markers - map not ready');
      return;
    }

    const layerId = 'stellar-pipeline';

    // Limpiar capa de pipeline si existe
    console.log('🧹 Cleaning up existing pipeline layers...');
    if (map.current.getLayer(`${layerId}-clusters-count`)) {
      map.current.removeLayer(`${layerId}-clusters-count`);
    }
    if (map.current.getLayer(`${layerId}-clusters`)) {
      map.current.removeLayer(`${layerId}-clusters`);
    }
    if (map.current.getLayer(`${layerId}-unclustered-point`)) {
      map.current.removeLayer(`${layerId}-unclustered-point`);
    }
    if (map.current.getLayer(`${layerId}-unclustered-point-text`)) {
      map.current.removeLayer(`${layerId}-unclustered-point-text`);
    }
    if (map.current.getSource(`${layerId}-data`)) {
      map.current.removeSource(`${layerId}-data`);
    }

    // Agregar markers si el pipeline está activo y hay datos
    if (isPipelineActive && pipelineData && pipelineData.length > 0) {
      console.log(`📍 Adding stellar_pipeline layer with ${pipelineData.length} items`);
      console.log('📊 Pipeline data sample:', pipelineData.slice(0, 3));
      addPipelineLayer(pipelineData);
    } else {
      console.log('⚠️ Not adding pipeline layer:', {
        isPipelineActive,
        hasData: !!(pipelineData && pipelineData.length > 0),
        dataLength: pipelineData?.length || 0
      });
    }
  }, [isPipelineActive, pipelineData, mapLoaded]);

  // Función para agregar capa de stellar_pipeline
  const addPipelineLayer = (data) => {
    if (!map.current) {
      console.error('❌ Cannot add pipeline layer - map not initialized');
      return;
    }

    console.log('🎨 Starting to add pipeline layer with', data.length, 'items');

    const layerId = 'stellar-pipeline';
    const color = '#FF6B35'; // Color naranja para stellar_pipeline

    // Convertir datos a GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.map((item, index) => {
        // Obtener coordenadas de diferentes formatos posibles
        const lng = item.longitude || item.lng || item.lon || item.long || item.x || item.x_coord || item.coord_x;
        const lat = item.latitude || item.lat || item.latitud || item.y || item.y_coord || item.coord_y;
        
        if (!lng || !lat) {
          console.warn(`⚠️ Item ${index} missing coordinates:`, {
            id: item.id,
            keys: Object.keys(item),
            hasLng: !!lng,
            hasLat: !!lat
          });
        }

        const coordinates = [lng || -80.1918, lat || 25.7617];

        return {
          type: 'Feature',
          properties: {
            id: item.id,
            name: item.name || item.title || 'Pipeline Item',
            status: item.status,
            product: item.product,
            units: item.units,
            ...item
          },
          geometry: {
            type: 'Point',
            coordinates: coordinates
          }
        };
      }).filter(feature => {
        // Filtrar features con coordenadas válidas
        const coords = feature.geometry.coordinates;
        return coords[0] && coords[1] && 
               coords[0] !== -80.1918 && coords[1] !== 25.7617; // Evitar coordenadas por defecto
      })
    };

    console.log('✅ GeoJSON created with', geojson.features.length, 'features');
    console.log('📍 Sample feature:', geojson.features[0]);

    // Agregar fuente de datos con clustering
    try {
      map.current.addSource(`${layerId}-data`, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
      console.log('✅ Source added successfully');
    } catch (error) {
      console.error('❌ Error adding source:', error);
      return;
    }

    // Capa de clusters
    map.current.addLayer({
      id: `${layerId}-clusters`,
      type: 'circle',
      source: `${layerId}-data`,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': color,
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    // Capa de puntos individuales
    map.current.addLayer({
      id: `${layerId}-unclustered-point`,
      type: 'circle',
      source: `${layerId}-data`,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': color,
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Texto en clusters
    map.current.addLayer({
      id: `${layerId}-clusters-count`,
      type: 'symbol',
      source: `${layerId}-data`,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#fff'
      }
    });

    // Eventos de click en clusters
    map.current.on('click', `${layerId}-clusters`, (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [`${layerId}-clusters`]
      });
      const clusterId = features[0].properties.cluster_id;
      
      map.current.getSource(`${layerId}-data`).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Eventos de click en puntos individuales
    map.current.on('click', `${layerId}-unclustered-point`, (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [`${layerId}-unclustered-point`]
      });
      
      if (features.length > 0 && onMarkerClick) {
        const feature = features[0];
        console.log(`🖱️ Pipeline marker clicked:`, feature.properties);
        onMarkerClick({
          category: 'stellar_pipeline',
          categoryId: 'stellar-pipeline',
          ...feature.properties
        });
      }
    });

    // Cambiar cursor al hacer hover
    map.current.on('mouseenter', `${layerId}-clusters`, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', `${layerId}-clusters`, () => {
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', `${layerId}-unclustered-point`, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', `${layerId}-unclustered-point`, () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Función para agregar una capa de categoría al mapa
  const addCategoryLayer = (category, data) => {
    if (!map.current) return;

    // Convertir datos a GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: data.map((item, index) => ({
        type: 'Feature',
        properties: {
          id: item.id || index,
          name: item.name || item.nombre || `Item ${index + 1}`,
          category: category.id,
          ...item
        },
        geometry: {
          type: 'Point',
          coordinates: [item.longitude || item.lng || item.lon || -80.1918, item.latitude || item.lat || 25.7617]
        }
      }))
    };

    // Agregar fuente de datos
    map.current.addSource(`${category.id}-data`, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Capa de clusters
    map.current.addLayer({
      id: `${category.id}-clusters`,
      type: 'circle',
      source: `${category.id}-data`,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': category.color || '#3b82f6',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    // Capa de puntos individuales
    map.current.addLayer({
      id: `${category.id}-unclustered-point`,
      type: 'circle',
      source: `${category.id}-data`,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': category.color || '#3b82f6',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Texto en clusters
    map.current.addLayer({
      id: `${category.id}-clusters-count`,
      type: 'symbol',
      source: `${category.id}-data`,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#fff'
      }
    });

    // Eventos de click
    map.current.on('click', `${category.id}-clusters`, (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [`${category.id}-clusters`]
      });
      const clusterId = features[0].properties.cluster_id;
      
      map.current.getSource(`${category.id}-data`).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    map.current.on('click', `${category.id}-unclustered-point`, (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [`${category.id}-unclustered-point`]
      });
      
      if (features.length > 0 && onMarkerClick) {
        const feature = features[0];
        console.log(`🖱️ Marker clicked:`, { 
          category: category.slug, 
          categoryId: category.id,
          categoryName: category.nombre,
          feature: feature.properties 
        });
        console.log(`🔍 Category details:`, category);
        onMarkerClick({
          category: category.slug, // Usar slug en lugar de ID para consistencia
          categoryId: category.id,
          ...feature.properties
        });
      }
    });

    // Cambiar cursor al hacer hover
    map.current.on('mouseenter', `${category.id}-clusters`, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', `${category.id}-clusters`, () => {
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', `${category.id}-unclustered-point`, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', `${category.id}-unclustered-point`, () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  useEffect(() => {
    // Obtener el token de Mapbox desde las variables de entorno
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    console.log('=== MAPBOX INITIALIZATION ===');
    console.log('Token:', mapboxToken ? 'Found' : 'Not found');
    console.log('Token length:', mapboxToken ? mapboxToken.length : 0);
    console.log('Container ref:', mapContainer.current);
    console.log('Mapbox GL version:', mapboxgl.version);
    console.log('Map current:', map.current);
    
    if (!mapboxToken) {
      console.error('❌ Mapbox access token not found. Please check your .env file.');
      setMapLoaded(false);
      return;
    }

    if (!mapContainer.current) {
      console.error('❌ Map container not found');
      setMapLoaded(false);
      return;
    }

    // Configurar el token de Mapbox
    mapboxgl.accessToken = mapboxToken;

    // Inicializar el mapa solo si no existe y no se ha inicializado antes
    if (map.current || initialized.current) {
      console.log('⚠️ Map already initialized, skipping...');
      return;
    }

    // Marcar como inicializado
    initialized.current = true;

    console.log('🚀 Initializing Mapbox map...');
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-81.5158, 28.5383], // Orlando, FL
        zoom: 10
      });

      console.log('✅ Map instance created');

      // Evento cuando el mapa se carga completamente
      map.current.on('load', () => {
        console.log('✅ Mapbox map loaded successfully');
        setMapLoaded(true);
        
        // Agregar controles de navegación
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Función para actualizar bounds con debounce y validación de zoom
        let boundsTimeout = null;
        const updateBounds = () => {
          if (onBoundsChange && map.current) {
            // Validar que el zoom sea suficiente (mínimo nivel 10 para heatmap)
            const currentZoom = map.current.getZoom();
            if (currentZoom < 10) {
              // No enviar bounds si el zoom es muy bajo
              return;
            }
            
            // Cancelar timeout anterior si existe
            if (boundsTimeout) {
              clearTimeout(boundsTimeout);
            }
            
            // Agregar pequeño delay para evitar demasiadas llamadas
            boundsTimeout = setTimeout(() => {
              const bounds = map.current.getBounds();
              const lngDiff = bounds.getEast() - bounds.getWest();
              const latDiff = bounds.getNorth() - bounds.getSouth();
              
              // Validar que el área no sea demasiado grande
              if (lngDiff > 2.0 || latDiff > 2.0) {
                // No enviar bounds si el área es demasiado grande
                return;
              }
              
              onBoundsChange({
                min_lng: bounds.getWest(),
                min_lat: bounds.getSouth(),
                max_lng: bounds.getEast(),
                max_lat: bounds.getNorth()
              });
            }, 300); // 300ms de delay
          }
        };

        // Enviar bounds iniciales inmediatamente
        if (onBoundsChange && map.current) {
          const bounds = map.current.getBounds();
          onBoundsChange({
            min_lng: bounds.getWest(),
            min_lat: bounds.getSouth(),
            max_lng: bounds.getEast(),
            max_lat: bounds.getNorth()
          });
        }

        // Actualizar bounds cuando el mapa se mueve o hace zoom
        map.current.on('moveend', updateBounds);
        map.current.on('zoomend', updateBounds);

        // Arrays de datos para cada categoría de pipelines
        const pipelineData = {
          masterPlans: [
            { 
              id: 'mp-1', lng: -81.5158, lat: 28.5383, name: 'Harmony', 
              status: 'Active', address: 'Harmony, FL 34773', 
              units: '7,500', acres: '11,000', price: '$285,000 - $650,000',
              product: 'Master Planned Community', strategy: 'Development',
              developer: 'Sun Terra Communities', city: 'Harmony', county: 'Osceola County',
              price_min: '$285,000', price_max: '$650,000', total_units_planned: 7500,
              total_units_sold: 4200, date_opened: 'Mar 2005', date_sold_out: 'N/A',
              acreage: '11,000 acres'
            },
            { 
              id: 'mp-2', lng: -81.3789, lat: 28.5383, name: 'Avalon Park', 
              status: 'Active', address: 'Avalon Park, FL 32828', 
              units: '12,000', acres: '18,000', price: '$200,000 - $500,000',
              product: 'Master Planned Community', strategy: 'Development',
              developer: 'Avalon Park Group', city: 'Orlando', county: 'Orange County',
              price_min: '$200,000', price_max: '$500,000', total_units_planned: 12000,
              total_units_sold: 8500, date_opened: 'Jan 2000', date_sold_out: 'N/A',
              acreage: '18,000 acres'
            },
            { 
              id: 'mp-3', lng: -81.4500, lat: 28.5200, name: 'Lake Nona', 
              status: 'Active', address: 'Lake Nona, FL 32827', 
              units: '15,000', acres: '17,000', price: '$300,000 - $800,000',
              product: 'Master Planned Community', strategy: 'Development',
              developer: 'Tavistock Development', city: 'Orlando', county: 'Orange County',
              price_min: '$300,000', price_max: '$800,000', total_units_planned: 15000,
              total_units_sold: 12000, date_opened: 'Jun 2007', date_sold_out: 'N/A',
              acreage: '17,000 acres'
            },
            { 
              id: 'mp-4', lng: -81.2800, lat: 28.4200, name: 'Celebration Master Plan', 
              status: 'Completed', address: 'Celebration, FL', 
              units: '1,800', acres: '120.0', price: '$60,000,000',
              product: 'Residential', strategy: 'Theme Park Adjacent'
            },
            { 
              id: 'mp-5', lng: -81.2000, lat: 28.3600, name: 'Davenport Master Plan', 
              status: 'Planning', address: 'Davenport, FL', 
              units: '1,500', acres: '100.0', price: '$25,000,000',
              product: 'Residential', strategy: 'Affordable Housing'
            }
          ],
          subdivisions: [
            { 
              id: 'sub-1', lng: -81.5200, lat: 28.5400, name: 'Harmony/Cherry Hill', 
              status: 'Built Out', address: 'St Cloud, FL', 
              units: '342', acres: '11.0', price: '$2,450,000',
              product: 'Single Family', product_type: 'Single Family', strategy: 'L.Fund', bedrooms: '3-4',
              developer: 'Harmony Development Company', city: 'St Cloud',
              minimum_lot_width: '91 ft', maximum_lot_width: '95 ft',
              price_min: '$240,000', price_max: '$517,000', units_planned: '342'
            },
            { 
              id: 'sub-2', lng: -81.5100, lat: 28.5350, name: 'Lakeview Estates', 
              status: 'Development', address: 'Orlando, FL', 
              units: '180', acres: '25.0', price: '$1,850,000',
              product: 'Townhomes', product_type: 'Townhomes', strategy: 'Build & Hold', bedrooms: '2-3',
              developer: 'Lakeview Development Corp', city: 'Orlando',
              minimum_lot_width: '75 ft', maximum_lot_width: '85 ft',
              price_min: '$180,000', price_max: '$320,000', units_planned: '180'
            },
            { 
              id: 'sub-3', lng: -81.5250, lat: 28.5450, name: 'Downtown Heights', 
              status: 'Completed', address: 'Orlando, FL', 
              units: '250', acres: '8.5', price: '$3,200,000',
              product: 'Condos', product_type: 'Condos', strategy: 'Flip', bedrooms: '1-2',
              developer: 'Downtown Development LLC', city: 'Orlando',
              minimum_lot_width: '60 ft', maximum_lot_width: '70 ft',
              price_min: '$150,000', price_max: '$280,000', units_planned: '250'
            },
            { 
              id: 'sub-4', lng: -81.5050, lat: 28.5300, name: 'Sunset Villas', 
              status: 'Planning', address: 'Winter Park, FL', 
              units: '45', acres: '6.8', price: '$1,950,000',
              product: 'Villas', product_type: 'Villas', strategy: 'Luxury', bedrooms: '2-3',
              developer: 'Sunset Communities Inc', city: 'Winter Park',
              minimum_lot_width: '100 ft', maximum_lot_width: '120 ft',
              price_min: '$350,000', price_max: '$650,000', units_planned: '45'
            },
            { 
              id: 'sub-5', lng: -81.4000, lat: 28.5500, name: 'Orlando Commons', 
              status: 'Active', address: 'Orlando, FL', 
              units: '120', acres: '15.2', price: '$2,200,000',
              product: 'Single Family', product_type: 'Single Family', strategy: 'Build & Hold', bedrooms: '3-4',
              developer: 'Orlando Commons Group', city: 'Orlando',
              minimum_lot_width: '80 ft', maximum_lot_width: '90 ft',
              price_min: '$200,000', price_max: '$380,000', units_planned: '120'
            },
            { 
              id: 'sub-6', lng: -81.3500, lat: 28.4800, name: 'Kissimmee Gateway', 
              status: 'Development', address: 'Kissimmee, FL', 
              units: '200', acres: '18.5', price: '$2,800,000',
              product: 'Apartments', product_type: 'Apartments', strategy: 'Rent', bedrooms: '1-2',
              developer: 'Kissimmee Gateway Partners', city: 'Kissimmee',
              minimum_lot_width: '50 ft', maximum_lot_width: '60 ft',
              price_min: '$120,000', price_max: '$220,000', units_planned: '200'
            }
          ],
          landParcels: [
            { 
              id: 'lp-1', lng: -81.5158, lat: 28.5383, name: 'Parcel A-1', 
              acres: '25.5', status: 'Available', address: 'Orlando, FL',
              units: 'N/A', price: '$1,200,000', product: 'Raw Land',
              strategy: 'Land Banking'
            },
            { 
              id: 'lp-2', lng: -81.3789, lat: 28.5383, name: 'Parcel B-2', 
              acres: '18.2', status: 'Under Contract', address: 'Windermere, FL',
              units: 'N/A', price: '$950,000', product: 'Raw Land',
              strategy: 'Land Banking'
            },
            { 
              id: 'lp-3', lng: -81.4500, lat: 28.5200, name: 'Parcel C-3', 
              acres: '32.8', status: 'Available', address: 'Lake Nona, FL',
              units: 'N/A', price: '$1,800,000', product: 'Raw Land',
              strategy: 'Land Banking'
            },
            { 
              id: 'lp-4', lng: -81.2800, lat: 28.4200, name: 'Parcel D-4', 
              acres: '15.7', status: 'Sold', address: 'Celebration, FL',
              units: 'N/A', price: '$750,000', product: 'Raw Land',
              strategy: 'Land Banking'
            },
            { 
              id: 'lp-5', lng: -81.2000, lat: 28.3600, name: 'Parcel E-5', 
              acres: '42.3', status: 'Available', address: 'Davenport, FL',
              units: 'N/A', price: '$2,100,000', product: 'Raw Land',
              strategy: 'Land Banking'
            }
          ],
          rentComps: [
            { 
              id: 'rc-1', lng: -81.5158, lat: 28.5383, name: 'Orlando Rent Comp', 
              rent: '$2,500', bedrooms: '3', address: 'Orlando, FL',
              units: '1', acres: '0.25', price: '$450,000', product: 'Single Family',
              strategy: 'Rent Analysis', status: 'Active'
            },
            { 
              id: 'rc-2', lng: -81.3789, lat: 28.5383, name: 'Windermere Rent Comp', 
              rent: '$3,200', bedrooms: '4', address: 'Windermere, FL',
              units: '1', acres: '0.35', price: '$650,000', product: 'Single Family',
              strategy: 'Rent Analysis', status: 'Active'
            },
            { 
              id: 'rc-3', lng: -81.4500, lat: 28.5200, name: 'Lake Nona Rent Comp', 
              rent: '$2,800', bedrooms: '3', address: 'Lake Nona, FL',
              units: '1', acres: '0.30', price: '$520,000', product: 'Townhome',
              strategy: 'Rent Analysis', status: 'Active'
            },
            { 
              id: 'rc-4', lng: -81.2800, lat: 28.4200, name: 'Celebration Rent Comp', 
              rent: '$3,500', bedrooms: '4', address: 'Celebration, FL',
              units: '1', acres: '0.40', price: '$750,000', product: 'Single Family',
              strategy: 'Rent Analysis', status: 'Active'
            },
            { 
              id: 'rc-5', lng: -81.2000, lat: 28.3600, name: 'Davenport Rent Comp', 
              rent: '$1,800', bedrooms: '2', address: 'Davenport, FL',
              units: '1', acres: '0.20', price: '$280,000', product: 'Condo',
              strategy: 'Rent Analysis', status: 'Active'
            }
          ],
          publixLocations: [
            { 
              id: 'pub-1', lng: -81.5158, lat: 28.5383, name: 'Publix Orlando Central', 
              address: '1234 Main St, Orlando, FL', status: 'Active',
              units: '1', acres: '2.5', price: '$8,500,000', product: 'Retail',
              strategy: 'Anchor Tenant', type: 'Grocery Store'
            },
            { 
              id: 'pub-2', lng: -81.3789, lat: 28.5383, name: 'Publix Windermere', 
              address: '5678 Windermere Rd, Windermere, FL', status: 'Active',
              units: '1', acres: '3.0', price: '$12,000,000', product: 'Retail',
              strategy: 'Anchor Tenant', type: 'Grocery Store'
            },
            { 
              id: 'pub-3', lng: -81.4500, lat: 28.5200, name: 'Publix Lake Nona', 
              address: '9012 Lake Nona Blvd, Orlando, FL', status: 'Active',
              units: '1', acres: '2.8', price: '$10,500,000', product: 'Retail',
              strategy: 'Anchor Tenant', type: 'Grocery Store'
            },
            { 
              id: 'pub-4', lng: -81.2800, lat: 28.4200, name: 'Publix Celebration', 
              address: '3456 Celebration Blvd, Celebration, FL', status: 'Active',
              units: '1', acres: '3.2', price: '$15,000,000', product: 'Retail',
              strategy: 'Anchor Tenant', type: 'Grocery Store'
            },
            { 
              id: 'pub-5', lng: -81.2000, lat: 28.3600, name: 'Publix Davenport', 
              address: '7890 Hwy 27, Davenport, FL', status: 'Active',
              units: '1', acres: '2.0', price: '$6,500,000', product: 'Retail',
              strategy: 'Anchor Tenant', type: 'Grocery Store'
            }
          ],
          healthcareFacilities: [
            { 
              id: 'hf-1', lng: -81.5158, lat: 28.5383, name: 'Orlando Health', 
              type: 'Hospital', address: '1414 Kuhl Ave, Orlando, FL', status: 'Active',
              units: '1', acres: '25.0', price: '$150,000,000', product: 'Healthcare',
              strategy: 'Medical Hub', bedrooms: 'N/A'
            },
            { 
              id: 'hf-2', lng: -81.3789, lat: 28.5383, name: 'Windermere Medical', 
              type: 'Clinic', address: '1234 Main St, Windermere, FL', status: 'Active',
              units: '1', acres: '2.5', price: '$8,000,000', product: 'Healthcare',
              strategy: 'Community Care', bedrooms: 'N/A'
            },
            { 
              id: 'hf-3', lng: -81.4500, lat: 28.5200, name: 'Lake Nona Medical City', 
              type: 'Medical Complex', address: '6900 Tavistock Lakes Blvd, Orlando, FL', status: 'Active',
              units: '1', acres: '50.0', price: '$500,000,000', product: 'Healthcare',
              strategy: 'Medical City', bedrooms: 'N/A'
            },
            { 
              id: 'hf-4', lng: -81.2800, lat: 28.4200, name: 'Celebration Health', 
              type: 'Hospital', address: '400 Celebration Pl, Celebration, FL', status: 'Active',
              units: '1', acres: '30.0', price: '$200,000,000', product: 'Healthcare',
              strategy: 'Community Hospital', bedrooms: 'N/A'
            },
            { 
              id: 'hf-5', lng: -81.2000, lat: 28.3600, name: 'Davenport Urgent Care', 
              type: 'Urgent Care', address: '1234 Hwy 27, Davenport, FL', status: 'Active',
              units: '1', acres: '1.5', price: '$3,500,000', product: 'Healthcare',
              strategy: 'Urgent Care', bedrooms: 'N/A'
            }
          ],
          schools: [
            { 
              id: 'sch-1', lng: -81.5158, lat: 28.5383, name: 'Orlando Elementary', 
              type: 'Elementary', school_type: 'Elementary', address: '1234 Orange Ave, Orlando, FL', status: 'Active',
              units: '1', acres: '5.0', price: '$15,000,000', product: 'Education',
              strategy: 'Public School', bedrooms: 'N/A'
            },
            { 
              id: 'sch-2', lng: -81.3789, lat: 28.5383, name: 'Windermere High', 
              type: 'High School', school_type: 'High School', address: '5678 Main St, Windermere, FL', status: 'Active',
              units: '1', acres: '8.0', price: '$25,000,000', product: 'Education',
              strategy: 'Public School', bedrooms: 'N/A'
            },
            { 
              id: 'sch-3', lng: -81.4500, lat: 28.5200, name: 'Lake Nona Middle', 
              type: 'Middle School', school_type: 'Middle School', address: '9012 Lake Nona Blvd, Orlando, FL', status: 'Active',
              units: '1', acres: '6.5', price: '$20,000,000', product: 'Education',
              strategy: 'Public School', bedrooms: 'N/A'
            },
            { 
              id: 'sch-4', lng: -81.2800, lat: 28.4200, name: 'Celebration Academy', 
              type: 'Charter', school_type: 'Charter', address: '3456 Celebration Blvd, Celebration, FL', status: 'Active',
              units: '1', acres: '4.0', price: '$12,000,000', product: 'Education',
              strategy: 'Charter School', bedrooms: 'N/A'
            },
            { 
              id: 'sch-5', lng: -81.2000, lat: 28.3600, name: 'Davenport Elementary', 
              type: 'Elementary', school_type: 'Elementary', address: '7890 Hwy 27, Davenport, FL', status: 'Active',
              units: '1', acres: '3.5', price: '$10,000,000', product: 'Education',
              strategy: 'Public School', bedrooms: 'N/A'
            }
          ]
        };

        // Colores para cada categoría
        const pipelineColors = {
          masterPlans: '#ef4444',      // Rojo
          subdivisions: '#3b82f6',     // Azul
          landParcels: '#f59e0b',      // Naranja
          rentComps: '#10b981',        // Verde
          publixLocations: '#8b5cf6',  // Morado
          healthcareFacilities: '#ec4899', // Rosa
          schools: '#06b6d4'           // Cian
        };

        // Los marcadores de propiedades por defecto se han removido
        // Ahora se usan los pipelines del menú para mostrar datos

        // La lógica de clustering se ha removido
        // Ahora se usan los pipelines del menú para mostrar datos

        // Los iconos personalizados se han removido
        // Ahora se usan los pipelines del menú para mostrar datos

        // Función para agregar pipelines al mapa con clustering
        const addPipelineLayer = (category, data, color) => {
          const geojsonData = {
            type: 'FeatureCollection',
            features: data.map(item => ({
              type: 'Feature',
              properties: {
                id: item.id,
                name: item.name,
                address: item.address,
                status: item.status,
                units: item.units,
                acres: item.acres,
                price: item.price,
                product: item.product,
                strategy: item.strategy,
                bedrooms: item.bedrooms,
                type: item.type,
                school_type: item.school_type,
                developer: item.developer,
                product_type: item.product_type,
                city: item.city,
                minimum_lot_width: item.minimum_lot_width,
                maximum_lot_width: item.maximum_lot_width,
                price_min: item.price_min,
                price_max: item.price_max,
                units_planned: item.units_planned,
                rent: item.rent,
                // Campos específicos para masterPlans
                county: item.county,
                total_units_planned: item.total_units_planned,
                total_units_sold: item.total_units_sold,
                date_opened: item.date_opened,
                date_sold_out: item.date_sold_out,
                acreage: item.acreage
              },
              geometry: {
                type: 'Point',
                coordinates: [item.lng, item.lat]
              }
            }))
          };

          // Agregar fuente de datos con clustering
          map.current.addSource(category, {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
            clusterMinPoints: 2
          });

          // Agregar capa de clusters con el color de la categoría
          map.current.addLayer({
            id: `${category}-clusters`,
            type: 'circle',
            source: category,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': color,
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                15, // Radio para clusters pequeños
                5,
                20, // Radio para clusters medianos
                10,
                25  // Radio para clusters grandes
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.8
            }
          });

          // Agregar capa de conteo de clusters
          map.current.addLayer({
            id: `${category}-cluster-count`,
            type: 'symbol',
            source: category,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': [
                'step',
                ['get', 'point_count'],
                12, // Tamaño para clusters pequeños
                5,
                14, // Tamaño para clusters medianos
                10,
                16  // Tamaño para clusters grandes
              ],
              'text-offset': [0, 0],
              'text-anchor': 'center'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0, 0, 0, 0.5)',
              'text-halo-width': 1
            }
          });

          // Agregar capa de marcadores individuales (sin clustering)
          map.current.addLayer({
            id: `${category}-circles`,
            type: 'circle',
            source: category,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': color,
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.8
            }
          });

          // Agregar capa de símbolos para marcadores individuales
          map.current.addLayer({
            id: `${category}-labels`,
            type: 'symbol',
            source: category,
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-offset': [0, 2],
              'text-anchor': 'top',
              'text-allow-overlap': false,
              'text-ignore-placement': false
            },
            paint: {
              'text-color': '#1f2937',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            }
          });
        };

        // Función para remover pipelines del mapa
        const removePipelineLayer = (category) => {
          // Remover capas de clusters
          if (map.current.getLayer(`${category}-clusters`)) {
            map.current.removeLayer(`${category}-clusters`);
          }
          if (map.current.getLayer(`${category}-cluster-count`)) {
            map.current.removeLayer(`${category}-cluster-count`);
          }
          
          // Remover capas de marcadores individuales
          if (map.current.getLayer(`${category}-circles`)) {
            map.current.removeLayer(`${category}-circles`);
          }
          if (map.current.getLayer(`${category}-labels`)) {
            map.current.removeLayer(`${category}-labels`);
          }
          
          // Remover fuente de datos
          if (map.current.getSource(category)) {
            map.current.removeSource(category);
          }
        };

        // Función para toggle pipelines
        window.togglePipeline = (category, isActive) => {
          if (isActive) {
            addPipelineLayer(category, pipelineData[category], pipelineColors[category]);
          } else {
            removePipelineLayer(category);
          }
        };

        // Agregar eventos de click para pipelines
        const addPipelineClickEvents = (category) => {
          // Evento de click en clusters para expandir
          map.current.on('click', `${category}-clusters`, (e) => {
            const features = map.current.queryRenderedFeatures(e.point, {
              layers: [`${category}-clusters`]
            });
            const clusterId = features[0].properties.cluster_id;
            
            map.current.getSource(category).getClusterExpansionZoom(
              clusterId,
              (err, zoom) => {
                if (err) return;

                map.current.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom
                });
              }
            );
          });

          // Evento de click en marcadores individuales
          map.current.on('click', `${category}-circles`, (e) => {
            const properties = e.features[0].properties;
            console.log(`${category} clicked:`, properties);
            console.log('Available properties:', Object.keys(properties));
            
            // Crear objeto de datos para la modal
            const modalData = {
              id: properties.id,
              dealName: properties.name,
              address: properties.address || `${properties.name}, Florida`,
              product: properties.product || properties.type || 'Pipeline Item',
              units: properties.units || 'N/A',
              acres: properties.acres || 'N/A',
              strategy: properties.strategy || category,
              status: properties.status || 'Active',
              price: properties.price || 'N/A',
              category: category,
              bedrooms: properties.bedrooms || 'N/A',
              type: properties.type || properties.school_type || 'N/A',
              school_type: properties.school_type || properties.type || 'N/A',
              // Campos específicos para subdivisions
              developer: properties.developer || 'N/A',
              product_type: properties.product_type || properties.product || 'N/A',
              city: properties.city || 'N/A',
              minimum_lot_width: properties.minimum_lot_width || 'N/A',
              maximum_lot_width: properties.maximum_lot_width || 'N/A',
              price_min: properties.price_min || 'N/A',
              price_max: properties.price_max || 'N/A',
              units_planned: properties.units_planned || properties.units || 'N/A',
              // Campos específicos para masterPlans
              county: properties.county || 'N/A',
              total_units_planned: properties.total_units_planned || properties.units_planned || 'N/A',
              total_units_sold: properties.total_units_sold || 'N/A',
              date_opened: properties.date_opened || 'N/A',
              date_sold_out: properties.date_sold_out || 'N/A',
              acreage: properties.acreage || 'N/A'
            };
            
            // Llamar a la función onMarkerClick para abrir la modal
            if (onMarkerClick) {
              onMarkerClick(modalData);
            }
          });

          // Eventos de hover para clusters
          map.current.on('mouseenter', `${category}-clusters`, () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', `${category}-clusters`, () => {
            map.current.getCanvas().style.cursor = '';
          });

          // Eventos de hover para marcadores individuales
          map.current.on('mouseenter', `${category}-circles`, () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', `${category}-circles`, () => {
            map.current.getCanvas().style.cursor = '';
          });
        };

        // Inicializar eventos para todas las categorías
        Object.keys(pipelineData).forEach(category => {
          addPipelineClickEvents(category);
        });

        // Los eventos de click de clusters se han removido
        // Ahora se usan los pipelines del menú para mostrar datos


        // Los efectos de hover de clusters se han removido
        // Ahora se usan los pipelines del menú para mostrar datos


        
        console.log('🎯 Markers and controls added');
      });

      // Evento de error - filtrar errores de tiles individuales que son normales
      map.current.on('error', (e) => {
        // Filtrar errores de tiles individuales que son esperados (404, CORS, etc.)
        // Estos errores son normales cuando algunos tiles no existen o no se pueden cargar
        
        // Si el error tiene un tile asociado, es un error de tile individual (normal)
        if (e.tile) {
          // Estos son errores normales de tiles que no existen o no se pueden cargar
          // No los mostramos en la consola para evitar ruido
          return;
        }
        
        // Filtrar errores relacionados con tiles por el mensaje
        if (e.error && e.error.message) {
          const errorMsg = e.error.message.toLowerCase();
          // Ignorar errores comunes de tiles que no existen o no se pueden cargar
          if (errorMsg.includes('tile') || 
              errorMsg.includes('404') || 
              errorMsg.includes('failed to fetch') ||
              errorMsg.includes('network') ||
              errorMsg.includes('timeout')) {
            // Estos errores son normales para tiles que no existen en ciertos niveles de zoom
            return;
          }
        }
        
        // Solo mostrar errores críticos que no son de tiles
        // Estos son errores que realmente afectan la funcionalidad
        if (e.error && e.error.message) {
          const errorMsg = e.error.message.toLowerCase();
          // Solo mostrar errores que no son relacionados con tiles
          if (!errorMsg.includes('tile') && 
              !errorMsg.includes('404') && 
              !errorMsg.includes('failed to fetch') &&
              !errorMsg.includes('network') &&
              !errorMsg.includes('timeout')) {
            console.error('❌ Mapbox critical error:', e.error.message);
          }
        }
        
        // No cambiar el estado de carga por errores de tiles individuales
        // Solo cambiar el estado si es un error crítico
        if (!e.tile && e.error && e.error.message) {
          const errorMsg = e.error.message.toLowerCase();
          if (!errorMsg.includes('tile') && 
              !errorMsg.includes('404') && 
              !errorMsg.includes('failed to fetch')) {
            setMapLoaded(false);
          }
        }
      });

      // Evento de estilo cargado
      map.current.on('styledata', () => {
        console.log('🎨 Map style loaded');
      });

      // Evento de datos cargados
      map.current.on('sourcedata', (e) => {
        console.log('📊 Source data loaded:', e.sourceId);
      });

    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapLoaded(false);
    }

    // Timeout de seguridad para forzar la carga
    const loadTimeout = setTimeout(() => {
      console.log('⏰ Map load timeout - forcing load state');
      setMapLoaded(true);
    }, 3000);

    // Cleanup function
    return () => {
      clearTimeout(loadTimeout);
      // Solo limpiar si realmente necesitamos hacer cleanup
      // No limpiar inmediatamente después de crear el mapa
    };
  }, []); // Sin dependencias para evitar bucles

  // Estado para almacenar el centro del círculo
  const [circleCenter, setCircleCenter] = useState(null);

  // Función para actualizar el círculo (más simple y robusta)
  const updateCircle = (center, radius) => {
    if (!map.current || !center) return;

    try {
      // Crear nuevo círculo
      const circle = turf.circle(center, radius, { units: 'meters' });

      // Si ya existe la fuente, actualizar los datos
      if (map.current.getSource('radius-circle')) {
        map.current.getSource('radius-circle').setData(circle);
        console.log(`Círculo actualizado en: ${center[0]}, ${center[1]} con radio de ${radius}m`);
      } else {
        // Si no existe, crear la fuente y las capas
        map.current.addSource('radius-circle', {
          type: 'geojson',
          data: circle
        });

        // Agregar capa de relleno del círculo
        map.current.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.1
          }
        });

        // Agregar capa de borde del círculo
        map.current.addLayer({
          id: 'radius-circle-stroke',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2
          }
        });

        console.log(`Círculo creado en: ${center[0]}, ${center[1]} con radio de ${radius}m`);
      }
    } catch (error) {
      console.error('Error al actualizar círculo:', error);
    }
  };

  // Función para limpiar el círculo (solo cuando se desactiva el modo)
  const clearCircle = () => {
    if (!map.current) return;
    
    try {
      // Verificar y remover capas primero
      if (map.current.getLayer('radius-circle-fill')) {
        map.current.removeLayer('radius-circle-fill');
      }
      if (map.current.getLayer('radius-circle-stroke')) {
        map.current.removeLayer('radius-circle-stroke');
      }
      
      // Esperar un momento antes de remover la fuente
      setTimeout(() => {
        try {
          if (map.current && map.current.getSource('radius-circle')) {
            map.current.removeSource('radius-circle');
          }
        } catch (error) {
          console.warn('Error al remover fuente del círculo:', error);
        }
      }, 100);
    } catch (error) {
      console.warn('Error al limpiar círculo:', error);
    }
  };

  // Efecto para manejar el modo de radio
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMapClick = (e) => {
      if (!isRadiusMode) return;

      const { lng, lat } = e.lngLat;
      const center = [lng, lat];
      
      setCircleCenter(center);
      updateCircle(center, radiusValue);
    };

    if (isRadiusMode) {
      map.current.on('click', handleMapClick);
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      map.current.off('click', handleMapClick);
      map.current.getCanvas().style.cursor = '';
      
      // Remover círculo si existe
      clearCircle();
      setCircleCenter(null);
    }

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
        map.current.getCanvas().style.cursor = '';
      }
    };
  }, [isRadiusMode, mapLoaded]);

  // Efecto para actualizar el círculo cuando cambia el radio
  useEffect(() => {
    if (circleCenter && isRadiusMode) {
      updateCircle(circleCenter, radiusValue);
    }
  }, [radiusValue, circleCenter, isRadiusMode]);

  // Efecto separado para cleanup cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (map.current) {
        console.log('🧹 Final cleanup - removing map');
        map.current.remove();
        map.current = null;
        initialized.current = false;
      }
    };
  }, []);

  // Efecto para el círculo de radio
  useEffect(() => {
    if (!map.current || !showRadiusAnalysis) return;

    // Crear o actualizar el círculo de radio
    const center = map.current.getCenter();
    const radiusInMeters = radiusMiles * 1609.34; // Convertir millas a metros

    // Remover círculo existente si existe
    if (map.current.getSource('radius-circle')) {
      map.current.removeLayer('radius-circle');
      map.current.removeSource('radius-circle');
    }

    // Crear círculo usando turf.js (incluido en mapbox-gl)
    const circle = turf.circle([center.lng, center.lat], radiusMiles, { units: 'miles' });

    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: circle
    });

    map.current.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
      }
    });

    map.current.addLayer({
      id: 'radius-circle-border',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2
      }
    });

  }, [showRadiusAnalysis, radiusMiles]);

  // Manejar Price Heatmap
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const layerId = 'price-heatmap';

    // Limpiar eventos de click y hover antes de remover la capa
    try {
      map.current.off('click', layerId);
      map.current.off('mouseenter', layerId);
      map.current.off('mouseleave', layerId);
    } catch (e) {
      // Ignorar errores si la capa no existe
    }

    // Limpiar capa de heatmap si existe
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(`${layerId}-data`)) {
      map.current.removeSource(`${layerId}-data`);
    }

    // Agregar heatmap si está activo y hay datos
    if (showPriceHeatmap && priceHeatmapData) {
      console.log('📍 Adding price heatmap layer');
      addPriceHeatmapLayer(priceHeatmapData);
    }
  }, [showPriceHeatmap, priceHeatmapData, mapLoaded]);

  // Manejar Count Heatmap
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const layerId = 'count-heatmap';

    // Limpiar eventos de click y hover antes de remover la capa
    try {
      map.current.off('click', layerId);
      map.current.off('mouseenter', layerId);
      map.current.off('mouseleave', layerId);
    } catch (e) {
      // Ignorar errores si la capa no existe
    }

    // Limpiar capa de heatmap si existe
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(`${layerId}-data`)) {
      map.current.removeSource(`${layerId}-data`);
    }

    // Agregar heatmap si está activo y hay datos
    if (showCountHeatmap && countHeatmapData) {
      console.log('📍 Adding count heatmap layer');
      addCountHeatmapLayer(countHeatmapData);
    }
  }, [showCountHeatmap, countHeatmapData, mapLoaded]);

  // Manejar Wetlands Tiles
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Usar HTTPS en producción, HTTP solo en desarrollo local
    // Si la página está en HTTPS, debemos usar HTTPS para evitar Mixed Content errors
    const TILE_SERVER_URL = 'https://back.livestellar.com'
    
    console.log('💧 Tile server URL:', TILE_SERVER_URL, 'Page protocol:', window.location.protocol);
    
    const sourceId = 'wetlands-tiles';
    const fillLayerId = 'wetlands-fill';
    const outlineLayerId = 'wetlands-outline';

    // Remover layers si existen
    if (map.current.getLayer(fillLayerId)) {
      map.current.removeLayer(fillLayerId);
    }
    if (map.current.getLayer(outlineLayerId)) {
      map.current.removeLayer(outlineLayerId);
    }
    // Remover source si existe
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Agregar source y layers si está activo
    if (showWetlands) {
      console.log('💧 Adding wetlands tiles layer');
      
      try {
        // Agregar source de tiles
        const tilesUrl = `${TILE_SERVER_URL}/tiles/wetlands/{z}/{x}/{y}.pbf`;
        console.log('💧 Adding wetlands source with URL:', tilesUrl);
        
        map.current.addSource(sourceId, {
          type: 'vector',
          tiles: [tilesUrl],
          minzoom: 5,
          maxzoom: 14
        });
        
        // Escuchar errores del source para diagnosticar problemas de conexión
        const handleWetlandsError = (e) => {
          if (e.sourceId === sourceId) {
            const errorMessage = e.error?.message || e.error || 'Unknown error';
            
            // Filtrar errores comunes que son normales o del servidor
            if (errorMessage === 'Internal Server Error' || 
                errorMessage.includes('500') ||
                errorMessage.includes('Internal Server')) {
              // Estos son errores del servidor, no del cliente
              // Solo loguear ocasionalmente para no saturar la consola
              if (Math.random() < 0.01) { // Solo 1% de las veces
                console.warn('⚠️ Wetlands tile server error (Internal Server Error). This is a server-side issue.');
              }
              return;
            }
            
            // Para otros errores, mostrar información de diagnóstico
            console.error('❌ Wetlands source error:', {
              error: errorMessage,
              tile: e.tile,
              sourceId: e.sourceId,
              url: tilesUrl,
              tileCoords: e.tile ? { z: e.tile.z, x: e.tile.x, y: e.tile.y } : null
            });
            
            // Si es un error de conexión y estamos en HTTPS, sugerir verificar HTTPS
            if (window.location.protocol === 'https:' && 
                (errorMessage.includes('Failed to fetch') || 
                 errorMessage.includes('network') ||
                 errorMessage.includes('Mixed Content'))) {
              console.warn('⚠️ Possible HTTPS issue. Ensure tile server supports HTTPS at:', TILE_SERVER_URL);
            }
          }
        };
        
        map.current.on('error', handleWetlandsError);

        // Función para agregar las layers de wetlands
        const addWetlandsLayers = () => {
          try {
            // Verificar que el source existe antes de agregar layers
            const source = map.current.getSource(sourceId);
            if (!source) {
              console.warn('⚠️ Wetlands source not available yet');
              return;
            }

            // Verificar los source-layers disponibles en el source
            // Intentar obtener vectorLayers de diferentes maneras
            let vectorLayers = null;
            if (source.vectorLayers) {
              vectorLayers = source.vectorLayers;
            } else if (source._tileJSON && source._tileJSON.vector_layers) {
              vectorLayers = source._tileJSON.vector_layers;
            } else if (source.tileJSON && source.tileJSON.vector_layers) {
              vectorLayers = source.tileJSON.vector_layers;
            }
            
            if (vectorLayers) {
              console.log('💧 Available source-layers in wetlands tiles:', vectorLayers.map(l => l.id || l.name));
            } else {
              console.log('💧 VectorLayers not available yet, using default source-layer: "wetlands"');
              console.log('💧 Source object keys:', Object.keys(source));
            }

            // Agregar layer de fill solo si no existe
            if (!map.current.getLayer(fillLayerId)) {
              const fillLayer = {
                id: fillLayerId,
                type: 'fill',
                source: sourceId,
                'source-layer': 'wetlands',
                paint: {
                  'fill-color': [
                    'match',
                    ['get', 'wetland_type'],
                    'Freshwater Emergent Wetland', '#10b981',
                    'Freshwater Forested/Shrub Wetland', '#3b82f6',
                    'Freshwater Pond', '#8b5cf6',
                    'Estuarine and Marine Wetland', '#f59e0b',
                    'Estuarine and Marine Deepwater', '#06b6d4',
                    'Riverine', '#ef4444',
                    '#6b7280' // default/other
                  ],
                  'fill-opacity': 0.7
                }
              };
              
              try {
                map.current.addLayer(fillLayer);
                console.log('✅ Wetlands fill layer added:', fillLayerId);
              } catch (layerError) {
                console.error('❌ Error adding wetlands fill layer:', layerError);
                // Si el error es por source-layer, intentar sin especificar o con otro nombre
                if (layerError.message && layerError.message.includes('source-layer')) {
                  console.warn('⚠️ Trying to add layer without source-layer specification');
                  // Intentar agregar sin source-layer (usará el primero disponible)
                  try {
                    const fillLayerNoSource = { ...fillLayer };
                    delete fillLayerNoSource['source-layer'];
                    map.current.addLayer(fillLayerNoSource);
                    console.log('✅ Wetlands fill layer added without source-layer');
                  } catch (e2) {
                    console.error('❌ Still failed:', e2);
                  }
                }
              }
            } else {
              console.log('⚠️ Wetlands fill layer already exists');
            }

            // Agregar layer de outline solo si no existe
            if (!map.current.getLayer(outlineLayerId)) {
              const outlineLayer = {
                id: outlineLayerId,
                type: 'line',
                source: sourceId,
                'source-layer': 'wetlands',
                paint: {
                  'line-color': '#000',
                  'line-width': 0.5,
                  'line-opacity': 0.3
                }
              };
              
              map.current.addLayer(outlineLayer);
              console.log('✅ Wetlands outline layer added:', outlineLayerId);
            } else {
              console.log('⚠️ Wetlands outline layer already exists');
            }

            // Verificar que las layers se agregaron correctamente
            const addedFillLayer = map.current.getLayer(fillLayerId);
            const addedOutlineLayer = map.current.getLayer(outlineLayerId);
            
            console.log('💧 Wetlands layers status:', {
              fillLayerExists: !!addedFillLayer,
              outlineLayerExists: !!addedOutlineLayer,
              fillLayerVisible: addedFillLayer ? map.current.getLayoutProperty(fillLayerId, 'visibility') !== 'none' : false,
              outlineLayerVisible: addedOutlineLayer ? map.current.getLayoutProperty(outlineLayerId, 'visibility') !== 'none' : false
            });

            console.log('✅ Wetlands layers added successfully');
          } catch (layerError) {
            console.error('❌ Error adding wetlands layers:', layerError);
          }
        };

        // Intentar obtener vectorLayers del TileJSON cuando esté disponible
        const checkTileJSON = () => {
          const source = map.current.getSource(sourceId);
          if (!source) return null;
          
          // Intentar obtener vectorLayers de diferentes maneras
          let vectorLayers = null;
          if (source.vectorLayers) {
            vectorLayers = source.vectorLayers;
          } else if (source._tileJSON && source._tileJSON.vector_layers) {
            vectorLayers = source._tileJSON.vector_layers;
          } else if (source.tileJSON && source.tileJSON.vector_layers) {
            vectorLayers = source.tileJSON.vector_layers;
          } else if (source._tileJSONRequest && source._tileJSONRequest._callback) {
            // El TileJSON puede estar en el callback
            try {
              const tileJSON = source._tileJSONRequest._callback;
              if (tileJSON && tileJSON.vector_layers) {
                vectorLayers = tileJSON.vector_layers;
              }
            } catch (e) {
              // Ignorar errores
            }
          }
          
          return vectorLayers;
        };

        // Escuchar el evento sourcedata para agregar las layers cuando el source esté listo
        const handleSourceData = (e) => {
          if (e.sourceId === sourceId) {
            const source = map.current.getSource(sourceId);
            
            if (source) {
              const vectorLayers = checkTileJSON();
              
              console.log('💧 Wetlands source ready:', {
                sourceId: e.sourceId,
                sourceState: e.sourceState,
                isSourceLoaded: e.isSourceLoaded,
                hasVectorLayers: !!vectorLayers,
                vectorLayers: vectorLayers ? vectorLayers.map(l => l.id || l.name) : 'not available yet'
              });
              
              // Si tenemos vectorLayers, actualizar el source-layer si es necesario
              if (vectorLayers && vectorLayers.length > 0) {
                const firstLayer = vectorLayers[0];
                const actualSourceLayer = firstLayer.id || firstLayer.name;
                console.log('💧 Found source-layer:', actualSourceLayer);
                
                // Si el source-layer es diferente, actualizar las layers
                if (actualSourceLayer !== 'wetlands') {
                  console.log(`⚠️ Source-layer is "${actualSourceLayer}", not "wetlands". Updating layers...`);
                  // Remover layers existentes y recrearlas con el source-layer correcto
                  if (map.current.getLayer(fillLayerId)) {
                    map.current.removeLayer(fillLayerId);
                  }
                  if (map.current.getLayer(outlineLayerId)) {
                    map.current.removeLayer(outlineLayerId);
                  }
                  // Actualizar el source-layer en la función addWetlandsLayers
                  // Por ahora, intentar agregar con el source-layer correcto
                }
              }
              
              // Agregar las layers cuando el source esté listo
              if (!map.current.getLayer(fillLayerId) || !map.current.getLayer(outlineLayerId)) {
                console.log('💧 Adding wetlands layers after source is ready');
                addWetlandsLayers();
              }
              
              // Si el source está completamente cargado y tenemos vectorLayers, remover el listener
              if (e.isSourceLoaded && vectorLayers && vectorLayers.length > 0) {
                console.log('💧 Source fully loaded with vectorLayers, removing listener');
                map.current.off('sourcedata', handleSourceData);
              }
            }
          }
        };
        
        map.current.on('sourcedata', handleSourceData);
        
        // También intentar agregar las layers inmediatamente (por si el source ya está cargado)
        // Esto es útil si el source se carga muy rápido
        setTimeout(() => {
          const source = map.current.getSource(sourceId);
          if (source && (!map.current.getLayer(fillLayerId) || !map.current.getLayer(outlineLayerId))) {
            console.log('💧 Attempting to add wetlands layers after timeout');
            addWetlandsLayers();
          }
          
          // Verificar TileJSON después de un tiempo
          const vectorLayers = checkTileJSON();
          if (vectorLayers && vectorLayers.length > 0) {
            console.log('💧 TileJSON loaded, available source-layers:', vectorLayers.map(l => l.id || l.name));
          }
        }, 1000);

        // Cleanup: remover el listener cuando el componente se desmonte o showWetlands cambie
        return () => {
          if (map.current) {
            map.current.off('sourcedata', handleSourceData);
            map.current.off('error', handleWetlandsError);
          }
        };
      } catch (error) {
        console.error('❌ Error adding wetlands source:', error);
      }
    }

    // Cleanup: no hay nada que limpiar si showWetlands es false
    return () => {
      // El cleanup del listener se maneja dentro del bloque if (showWetlands)
    };
  }, [showWetlands, mapLoaded]);

  // Función para obtener color basado en el valor del precio
  const getPriceColor = (value) => {
    if (!value || value === 0) return '#fbbf24'; // Light yellow for no data
    
    // Mapear valores a colores según la leyenda: $0, $300K, $500K, $800K, $1.2M+
    if (value < 300000) return '#dc2626';      // Red - $0 to $300K
    if (value < 500000) return '#f97316';      // Orange - $300K to $500K
    if (value < 800000) return '#fbbf24';      // Yellow - $500K to $800K
    if (value < 1200000) return '#84cc16';     // Light green - $800K to $1.2M
    return '#22c55e';                          // Green - $1.2M+
  };

  // Función para agregar capa de Price Heatmap
  const addPriceHeatmapLayer = (data) => {
    if (!map.current) return;

    const layerId = 'price-heatmap';

    // Convertir datos a GeoJSON si no lo están ya
    let geojson;
    if (data.type === 'FeatureCollection') {
      geojson = data;
    } else if (Array.isArray(data)) {
      // Si es un array de features o objetos
      geojson = {
        type: 'FeatureCollection',
        features: data.map((item, index) => {
          // Si ya es una feature, usarla directamente
          if (item.type === 'Feature') {
            return item;
          }
          // Si es un objeto con geometry, convertirla
          if (item.geometry) {
            return {
              type: 'Feature',
              properties: item.properties || {},
              geometry: item.geometry
            };
          }
          // Si no tiene estructura clara, intentar inferirla
          return {
            type: 'Feature',
            properties: item,
            geometry: item.geom || item.geometry || { type: 'Polygon', coordinates: [] }
          };
        }).filter(f => f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0)
      };
    } else {
      console.error('❌ Invalid heatmap data format:', data);
      return;
    }

    // Validar que las features tengan geometrías válidas
    const validFeatures = geojson.features.filter(f => {
      if (!f.geometry) {
        console.warn('⚠️ Feature sin geometry:', f);
        return false;
      }
      if (!f.geometry.coordinates || f.geometry.coordinates.length === 0) {
        console.warn('⚠️ Feature sin coordinates:', f);
        return false;
      }
      if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') {
        console.warn('⚠️ Feature con tipo de geometry incorrecto:', f.geometry.type, f);
        return false;
      }
      return true;
    });

    console.log('📊 Heatmap GeoJSON:', { 
      type: geojson.type, 
      totalFeatures: geojson.features?.length || 0,
      validFeatures: validFeatures.length,
      sampleFeature: validFeatures[0],
      sampleGeometry: validFeatures[0]?.geometry
    });

    if (!validFeatures || validFeatures.length === 0) {
      console.warn('⚠️ No valid features in heatmap data');
      return;
    }

    // Usar solo las features válidas
    geojson.features = validFeatures;

    try {
      // Agregar fuente de datos
      const sourceId = `${layerId}-data`;
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });

      // Esperar a que la fuente se cargue antes de agregar la capa
      const source = map.current.getSource(sourceId);
      if (!source) {
        console.error('❌ Source not found after adding');
        return;
      }

      // Verificar que la fuente tenga datos
      source.on('data', (e) => {
        if (e.sourceState === 'loaded') {
          console.log('✅ Heatmap source loaded successfully');
        }
      });

      // Buscar el campo que contiene el precio (puede tener diferentes nombres)
      const sampleFeature = geojson.features[0];
      let priceField = 'price';
      
      if (sampleFeature && sampleFeature.properties) {
        // Buscar el campo que contiene el precio verificando que exista y no sea null
        if (sampleFeature.properties.price !== undefined && sampleFeature.properties.price !== null) {
          priceField = 'price';
        } else if (sampleFeature.properties.avg_price !== undefined && sampleFeature.properties.avg_price !== null) {
          priceField = 'avg_price';
        } else if (sampleFeature.properties.sale_price !== undefined && sampleFeature.properties.sale_price !== null) {
          priceField = 'sale_price';
        } else if (sampleFeature.properties.value !== undefined && sampleFeature.properties.value !== null) {
          priceField = 'value';
        }
      }

      console.log('🎨 Using price field name:', priceField, 'Sample value:', sampleFeature?.properties?.[priceField], 'All properties:', sampleFeature?.properties);
      console.log('📐 Sample geometry:', sampleFeature?.geometry);

      // Agregar capa de relleno con colores basados en el valor
      // Usar step para rangos discretos de colores
      const layerConfig = {
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', priceField]],
            '#E53935',      // Default - Red for Under $200K
            200000, '#FFC107',  // Yellow - $200K - $350K
            350000, '#FB8C00',  // Orange - $350K - $400K
            400000, '#7E57C2',  // Purple - $400K - $600K
            600000, '#4285F4',  // Blue - $600K - $700K
            700000, '#9E9E9E'   // Gray - $700K+
          ],
          'fill-opacity': 0.6,
          'fill-outline-color': '#ffffff'
        }
      };

      // Intentar agregar antes de las etiquetas, pero si no existe, agregar al final
      try {
        if (map.current.getLayer('road-label')) {
          map.current.addLayer(layerConfig, 'road-label');
        } else {
          map.current.addLayer(layerConfig);
        }
      } catch (e) {
        // Si falla, intentar agregar sin beforeId
        map.current.addLayer(layerConfig);
      }

      // Verificar que la capa se agregó correctamente
      const addedLayer = map.current.getLayer(layerId);
      if (addedLayer) {
        console.log('✅ Price heatmap layer added successfully:', {
          layerId,
          sourceId,
          featureCount: geojson.features.length,
          priceField,
          layerExists: !!addedLayer
        });

        // Agregar evento de click en los cuadros del heatmap
        map.current.on('click', layerId, (e) => {
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: [layerId]
          });
          
          if (features.length > 0 && onMarkerClick) {
            const feature = features[0];
            const properties = feature.properties;
            console.log('🖱️ Heatmap grid clicked:', properties);
            
            // Crear objeto de datos para el modal
            const gridData = {
              grid_id: properties.grid_id || properties.id,
              category: 'grid_sales',
              ...properties
            };
            
            onMarkerClick(gridData);
          }
        });

        // Cambiar cursor al hacer hover sobre los cuadros
        map.current.on('mouseenter', layerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', layerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      } else {
        console.error('❌ Layer was not added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding heatmap layer:', error);
    }
  };

  // Función para agregar capa de Count Heatmap
  const addCountHeatmapLayer = (data) => {
    if (!map.current) return;

    const layerId = 'count-heatmap';

    // Convertir datos a GeoJSON si no lo están ya
    let geojson;
    if (data.type === 'FeatureCollection') {
      geojson = data;
    } else if (Array.isArray(data)) {
      geojson = {
        type: 'FeatureCollection',
        features: data.map((item, index) => {
          if (item.type === 'Feature') {
            return item;
          }
          if (item.geometry) {
            return {
              type: 'Feature',
              properties: item.properties || {},
              geometry: item.geometry
            };
          }
          return {
            type: 'Feature',
            properties: item,
            geometry: item.geom || item.geometry || { type: 'Polygon', coordinates: [] }
          };
        }).filter(f => f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0)
      };
    } else {
      console.error('❌ Invalid count heatmap data format:', data);
      return;
    }

    // Validar que las features tengan geometrías válidas
    const validFeatures = geojson.features.filter(f => {
      if (!f.geometry) return false;
      if (!f.geometry.coordinates || f.geometry.coordinates.length === 0) return false;
      if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') return false;
      return true;
    });

    console.log('📊 Count Heatmap GeoJSON:', { 
      type: geojson.type, 
      totalFeatures: geojson.features?.length || 0,
      validFeatures: validFeatures.length,
      sampleFeature: validFeatures[0]
    });

    if (!validFeatures || validFeatures.length === 0) {
      console.warn('⚠️ No valid features in count heatmap data');
      return;
    }

    geojson.features = validFeatures;

    try {
      const sourceId = `${layerId}-data`;
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });

      const source = map.current.getSource(sourceId);
      if (!source) {
        console.error('❌ Source not found after adding');
        return;
      }

      source.on('data', (e) => {
        if (e.sourceState === 'loaded') {
          console.log('✅ Count heatmap source loaded successfully');
        }
      });

      // Buscar el campo que contiene el conteo (sales_count)
      const sampleFeature = geojson.features[0];
      let countField = 'sales_count';
      
      if (sampleFeature && sampleFeature.properties) {
        if (sampleFeature.properties.sales_count !== undefined && sampleFeature.properties.sales_count !== null) {
          countField = 'sales_count';
        } else if (sampleFeature.properties.count !== undefined && sampleFeature.properties.count !== null) {
          countField = 'count';
        }
      }

      console.log('🎨 Using count field name:', countField, 'Sample value:', sampleFeature?.properties?.[countField]);

      // Agregar capa de relleno con colores basados en el conteo
      const layerConfig = {
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', countField]],
            '#FFC107',      // Default - Yellow (Below average)
            35, '#22c55e',  // Green (Average - 35 sales)
            36, '#4285F4'  // Blue (Above mean)
          ],
          'fill-opacity': 0.6,
          'fill-outline-color': '#ffffff'
        }
      };

      try {
        if (map.current.getLayer('road-label')) {
          map.current.addLayer(layerConfig, 'road-label');
        } else {
          map.current.addLayer(layerConfig);
        }
      } catch (e) {
        map.current.addLayer(layerConfig);
      }

      const addedLayer = map.current.getLayer(layerId);
      if (addedLayer) {
        console.log('✅ Count heatmap layer added successfully:', {
          layerId,
          sourceId,
          featureCount: geojson.features.length,
          countField,
          layerExists: !!addedLayer
        });

        // Agregar evento de click en los cuadros del count heatmap
        map.current.on('click', layerId, (e) => {
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: [layerId]
          });
          
          if (features.length > 0 && onMarkerClick) {
            const feature = features[0];
            const properties = feature.properties;
            console.log('🖱️ Count heatmap grid clicked:', properties);
            
            const gridData = {
              grid_id: properties.grid_id || properties.id,
              category: 'grid_sales',
              ...properties
            };
            
            onMarkerClick(gridData);
          }
        });

        map.current.on('mouseenter', layerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', layerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
      } else {
        console.error('❌ Count heatmap layer was not added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding count heatmap layer:', error);
    }
  };

  return (
    <div className="mapbox-container">
      <div ref={mapContainer} className="mapbox-map" style={{ width: '100%', height: '100%' }} />
      
      {!mapLoaded && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Cargando mapa...</p>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Token: {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? 'Configurado' : 'No encontrado'}
          </div>
        </div>
      )}
    </div>
  );
});

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap;
