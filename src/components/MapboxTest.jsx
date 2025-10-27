import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxTest = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    console.log('=== MAPBOX DEBUG ===');
    console.log('Token:', mapboxToken);
    console.log('Token length:', mapboxToken ? mapboxToken.length : 0);
    console.log('Container:', mapContainer.current);
    console.log('Mapbox GL version:', mapboxgl.version);
    
    if (!mapboxToken) {
      console.error('❌ No Mapbox token found');
      return;
    }

    if (!mapContainer.current) {
      console.error('❌ No container found');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      
      console.log('✅ Token set, initializing map...');
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-81.5158, 28.5383],
        zoom: 10
      });

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully!');
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });

    } catch (error) {
      console.error('❌ Error creating map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid red' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', zIndex: 1000 }}>
        <p>Token: {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? '✅ Found' : '❌ Missing'}</p>
        <p>Container: {mapContainer.current ? '✅ Ready' : '❌ Not ready'}</p>
      </div>
    </div>
  );
};

export default MapboxTest;

