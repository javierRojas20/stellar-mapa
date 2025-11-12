import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

/**
 * Hook para obtener datos del heatmap de precios desde Supabase RPC
 * @param {boolean} isActive - Si el switch está activo
 * @param {Object} bounds - Objetos con min_lng, min_lat, max_lng, max_lat
 * @param {number} limit - Límite de filas a retornar (reducido para evitar timeouts)
 */
export const usePriceHeatmap = (isActive = false, bounds = null, limit = 500) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Solo hacer la consulta cuando el switch esté activo y tengamos bounds
    if (!isActive || !bounds) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    // Calcular el área del bbox para validar si es demasiado grande
    const lngDiff = bounds.max_lng - bounds.min_lng
    const latDiff = bounds.max_lat - bounds.min_lat
    const area = lngDiff * latDiff

    // Si el área es muy grande (más de ~2 grados en cualquier dirección), rechazar la consulta
    if (lngDiff > 2.0 || latDiff > 2.0) {
      console.warn('⚠️ Área del mapa demasiado grande para heatmap:', { lngDiff, latDiff, area })
      setError('Por favor, acerca el mapa para ver el heatmap. El área visible es demasiado grande.')
      setData(null)
      setLoading(false)
      return
    }

    const fetchHeatmapData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Fetching price heatmap data with bounds:', bounds, 'Area:', area.toFixed(4))

        const { data: geoData, error: geoError } = await supabase
          .rpc('get_grid_geojson_in_bbox', {
            min_lng: bounds.min_lng,
            min_lat: bounds.min_lat,
            max_lng: bounds.max_lng,
            max_lat: bounds.max_lat,
            limit_rows: limit
          })

        console.log('📊 Heatmap RPC result:', { 
          dataLength: geoData?.length || 0,
          error: geoError,
          hasData: !!geoData
        })

        if (geoError) {
          console.error('❌ Error fetching heatmap data:', geoError)
          
          // Manejar específicamente el error de timeout
          if (geoError.code === '57014' || geoError.message?.includes('timeout')) {
            setError('La consulta está tomando demasiado tiempo. Intenta acercar el mapa o reducir el área visible.')
          } else {
            setError(geoError.message || 'Error al obtener datos del heatmap')
          }
          
          setData(null)
          setLoading(false)
          return
        }

        if (geoData) {
          console.log(`✅ Found heatmap data`)
          // geoData puede ser un GeoJSON FeatureCollection o un string que necesite parsearse
          let parsedData = geoData;
          
          // Si es un string, intentar parsearlo
          if (typeof geoData === 'string') {
            try {
              parsedData = JSON.parse(geoData);
            } catch (e) {
              console.error('❌ Error parsing heatmap data:', e);
              setData(null);
              setLoading(false);
              return;
            }
          }
          
          // Si es un array de features, convertirlo a FeatureCollection
          if (Array.isArray(parsedData)) {
            parsedData = {
              type: 'FeatureCollection',
              features: parsedData
            };
          }
          
          console.log('📊 Parsed heatmap data:', {
            type: parsedData.type,
            featureCount: parsedData.features?.length || 0,
            sampleFeature: parsedData.features?.[0]
          });
          
          setData(parsedData)
        } else {
          console.warn('⚠️ No heatmap data found')
          setData(null)
        }
      } catch (err) {
        console.error('💥 Error in fetchHeatmapData:', err)
        setError(err.message)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    // Debounce para evitar múltiples llamadas cuando el usuario mueve el mapa rápidamente
    const timeoutId = setTimeout(() => {
      fetchHeatmapData()
    }, 500) // Esperar 500ms después de que los bounds cambien

    // Limpiar timeout si los bounds cambian antes de que se complete
    return () => {
      clearTimeout(timeoutId)
    }
  }, [isActive, bounds, limit])

  return {
    data,
    loading,
    error
  }
}

