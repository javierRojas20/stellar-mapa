import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

/**
 * Hook para cargar datos de stellar_pipeline con filtros
 * @param {boolean} isActive - Si el switch está activo
 * @param {string} selectedProduct - Producto seleccionado ('' para "All Products")
 * @param {string} selectedStatus - Estado seleccionado ('' para "All Statuses")
 */
export const usePipelineData = (isActive = false, selectedProduct = '', selectedStatus = '') => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Solo hacer la consulta cuando el switch esté activo
    if (!isActive) {
      setData([])
      setLoading(false)
      return
    }

    const fetchPipelineData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Fetching pipeline data with filters:', { selectedProduct, selectedStatus })

        // Construir la consulta con filtros
        let query = supabase
          .from('stellar_pipeline')
          .select('*')

        // Aplicar filtros si no son "All"
        if (selectedProduct && selectedProduct !== 'All Products' && selectedProduct !== '') {
          query = query.eq('product', selectedProduct)
        }

        if (selectedStatus && selectedStatus !== 'All Statuses' && selectedStatus !== '') {
          query = query.eq('status', selectedStatus)
        }

        const { data: pipelineData, error: fetchError } = await query

        console.log('📊 Pipeline data query result:', { 
          dataLength: pipelineData?.length,
          error: fetchError,
          filters: { selectedProduct, selectedStatus }
        })

        if (fetchError) {
          console.error('❌ Error fetching pipeline data:', fetchError)
          setError(fetchError.message)
          setData([])
          setLoading(false)
          return
        }

        if (pipelineData && pipelineData.length > 0) {
          console.log(`✅ Found ${pipelineData.length} pipeline records`)
          
          // Mostrar estructura del primer registro para debugging
          if (pipelineData[0]) {
            const allKeys = Object.keys(pipelineData[0]);
            console.log('📋 Sample record structure:', {
              keys: allKeys,
              keysList: allKeys.join(', '),
              sample: pipelineData[0],
              allValues: pipelineData[0]
            })
          }
          
          // Filtrar items que tengan coordenadas válidas
          // Buscar campos que puedan contener coordenadas con diferentes nombres
          const validData = pipelineData.filter((item, index) => {
            // Buscar latitud y longitud con diferentes nombres posibles
            const lat = item.latitude || item.lat || item.latitud || item.y || item.y_coord || item.coord_y;
            const lng = item.longitude || item.lng || item.lon || item.long || item.x || item.x_coord || item.coord_x;
            
            // También buscar en campos que puedan ser arrays o strings
            let hasCoords = false;
            if (lat && lng) {
              hasCoords = true;
            } else if (item.location || item.coordinates || item.geom) {
              // Podría ser un campo JSON o PostGIS geometry
              console.log(`📍 Item ${item.id} tiene campo de ubicación especial:`, {
                location: item.location,
                coordinates: item.coordinates,
                geom: item.geom
              });
            }
            
            if (!hasCoords && index < 3) {
              console.warn('⚠️ Item sin coordenadas:', {
                id: item.id,
                allKeys: Object.keys(item),
                values: item,
                checkedFields: {
                  latitude: item.latitude,
                  lat: item.lat,
                  longitude: item.longitude,
                  lng: item.lng,
                  lon: item.lon
                }
              })
            }
            
            return hasCoords
          })

          console.log(`📍 Valid records with coordinates: ${validData.length} of ${pipelineData.length}`)
          setData(validData)
        } else {
          console.warn('⚠️ No pipeline data found')
          setData([])
        }
      } catch (err) {
        console.error('💥 Error in fetchPipelineData:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchPipelineData()
  }, [isActive, selectedProduct, selectedStatus])

  return {
    data,
    loading,
    error
  }
}

