import React, { useState, useEffect, useRef } from 'react';
import { MAPBOX_TOKEN } from '../config/mapbox';

const AddressSearch = ({ onLocationSelect }) => {
  // Usar el token de Mapbox (puede venir de config o de env)
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || MAPBOX_TOKEN;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para buscar direcciones usando Mapbox Geocoding API
  const searchAddresses = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Usar Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=US&` +
        `bbox=-87.6,24.4,-79.8,31.0&` + // Bounding box de Florida
        `limit=5&` +
        `types=address,poi,place`
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para evitar demasiadas llamadas a la API
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Manejar selección de una sugerencia
  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.place_name || suggestion.text);
    setShowSuggestions(false);
    
    // Extraer coordenadas
    const [longitude, latitude] = suggestion.center;
    
    // Llamar a la función callback para centrar el mapa
    if (onLocationSelect) {
      onLocationSelect({
        latitude,
        longitude,
        placeName: suggestion.place_name || suggestion.text,
        bbox: suggestion.bbox
      });
    }
  };

  // Manejar búsqueda al presionar Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-icon">🔍</div>
      <input
        type="text"
        placeholder="Search for an address, parcel or saved site"
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      {isLoading && (
        <div className="search-loading">
          <div className="search-spinner"></div>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions" ref={suggestionsRef}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className="search-suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div className="suggestion-icon">📍</div>
              <div className="suggestion-content">
                <div className="suggestion-primary">{suggestion.text}</div>
                <div className="suggestion-secondary">
                  {suggestion.place_name?.replace(suggestion.text + ', ', '') || ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressSearch;

