import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

/**
 * Hook para obtener los filtros dinámicos de la tabla stellar_pipeline
 * Retorna los valores únicos de status y product
 */
export const usePipelineFilters = (isActive = false) => {
  const [statuses, setStatuses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Solo hacer la consulta cuando el switch esté activo
    if (!isActive) {
      setStatuses([])
      setProducts([])
      setLoading(false)
      return
    }

    const fetchFilters = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔍 Fetching pipeline filters from stellar_pipeline...')

        // Verificar sesión primero
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('🔐 Session check:', { 
          hasSession: !!sessionData?.session, 
          userId: sessionData?.session?.user?.id 
        })

        // Probar diferentes formas de consultar la tabla
        // Primero intentar con select específico
        let data = null
        let queryError = null

        // Intentar 1: Select específico de status y product
        const { data: specificData, error: specificError } = await supabase
          .from('stellar_pipeline')
          .select('status, product')

        console.log('📊 Specific columns query:', { 
          dataLength: specificData?.length,
          error: specificError,
          hasData: !!specificData,
          firstRecord: specificData?.[0]
        })

        if (specificError) {
          console.error('❌ Error with specific query:', specificError)
          queryError = specificError
        } else if (specificData && specificData.length > 0) {
          data = specificData
          console.log('✅ Success with specific columns query')
        } else {
          // Si devuelve vacío, probar con select *
          console.log('⚠️ Specific query returned empty, trying select *')
          const { data: allData, error: allError } = await supabase
            .from('stellar_pipeline')
            .select('*')
            .limit(100)

          console.log('📊 All columns query:', { 
            dataLength: allData?.length,
            error: allError,
            hasData: !!allData,
            firstRecord: allData?.[0]
          })

          if (allError) {
            console.error('❌ Error with all columns query:', allError)
            queryError = allError
          } else if (allData && allData.length > 0) {
            data = allData
            console.log('✅ Success with all columns query')
          } else {
            // Si ambas devuelven vacío, es problema de RLS
            console.warn('⚠️ Both queries returned empty - RLS may be blocking access')
            console.warn('💡 Check RLS policies for stellar_pipeline table')
            
            // Intentar verificar si hay datos contando
            const { count, error: countError } = await supabase
              .from('stellar_pipeline')
              .select('*', { count: 'exact', head: true })

            console.log('📊 Count query:', { 
              count,
              error: countError
            })

            if (countError) {
              setError(`RLS bloqueando acceso. Error: ${countError.message}`)
            } else {
              setError(`RLS bloqueando acceso. La tabla tiene ${count || 0} registros pero no se pueden leer.`)
            }
            setStatuses([])
            setProducts([])
            setLoading(false)
            return
          }
        }

        if (queryError) {
          setError(queryError.message)
          setStatuses([])
          setProducts([])
          setLoading(false)
          return
        }

        // Procesar datos si los tenemos
        if (data && data.length > 0) {
          console.log(`✅ Found ${data.length} records in stellar_pipeline`)
          
          // Obtener valores únicos de status (eliminar null/undefined y duplicados)
          const uniqueStatuses = [...new Set(
            data
              .map(item => item.status)
              .filter(status => status !== null && status !== undefined && status !== '')
              .map(status => String(status).trim())
          )].sort()

          // Obtener valores únicos de product (eliminar null/undefined y duplicados)
          const uniqueProducts = [...new Set(
            data
              .map(item => item.product)
              .filter(product => product !== null && product !== undefined && product !== '')
              .map(product => String(product).trim())
          )].sort()

          console.log('📋 Extracted unique values:', {
            statuses: uniqueStatuses,
            products: uniqueProducts,
            statusCount: uniqueStatuses.length,
            productCount: uniqueProducts.length
          })

          // Actualizar estados con los valores encontrados, agregando "All" al inicio
          if (uniqueStatuses.length > 0) {
            setStatuses(['All Statuses', ...uniqueStatuses])
          }
          if (uniqueProducts.length > 0) {
            setProducts(['All Products', ...uniqueProducts])
          }

          console.log('✅ Pipeline filters loaded successfully')
          setLoading(false)
          return
        } else {
          // Si la consulta funciona pero devuelve vacío, puede ser RLS
          console.warn('⚠️ Query succeeded but returned empty array - possible RLS issue')
          console.warn('💡 Tip: Verifica que la tabla tenga políticas RLS adecuadas o que el usuario tenga permisos')
          setStatuses([])
          setProducts([])
        }

        // Si llegamos aquí sin datos
        console.warn('⚠️ No data found in stellar_pipeline')
        setStatuses([])
        setProducts([])
      } catch (err) {
        console.error('💥 Error in fetchFilters:', err)
        setError(err.message)
        setStatuses([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchFilters()
  }, [isActive])

  return {
    statuses,
    products,
    loading,
    error
  }
}

