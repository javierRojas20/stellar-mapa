import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

const MapboxMap = ({ 
  showRadiusAnalysis, 
  radiusMiles, 
  onMarkerClick, 
  selectedDeal,
  isRadiusMode,
  radiusValue,
  categoryData,
  layers,
  categories
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const initialized = useRef(false);
  const [activeLayers, setActiveLayers] = useState({});

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

      // Evento de error
      map.current.on('error', (e) => {
        console.error('❌ Mapbox error:', e);
        setMapLoaded(false);
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
};

export default MapboxMap;
