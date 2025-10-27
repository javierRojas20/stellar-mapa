import { useState, useCallback } from 'react'
import { loadTableData } from '../services/dataLoader'

export const useCategoryData = () => {
  const [categoryData, setCategoryData] = useState({})
  const [loadingStates, setLoadingStates] = useState({})
  const [errors, setErrors] = useState({})

  const loadCategoryData = useCallback(async (categoryId, categorySlug) => {
    try {
      // Set loading state
      setLoadingStates(prev => ({ ...prev, [categorySlug]: true }))
      setErrors(prev => ({ ...prev, [categorySlug]: null }))

      console.log(`🔄 Loading data for category: ${categorySlug}`)
      
      const { data, error } = await loadTableData(categorySlug)
      
      if (error) {
        throw error
      }

      console.log(`✅ Data loaded for ${categorySlug}:`, data)
      
      // Update category data using slug as key
      setCategoryData(prev => ({
        ...prev,
        [categorySlug]: data || []
      }))

    } catch (err) {
      console.error(`❌ Error loading data for ${categorySlug}:`, err)
      setErrors(prev => ({ 
        ...prev, 
        [categorySlug]: err.message 
      }))
    } finally {
      setLoadingStates(prev => ({ ...prev, [categorySlug]: false }))
    }
  }, [])

  const clearCategoryData = useCallback((categorySlug) => {
    setCategoryData(prev => {
      const newData = { ...prev }
      delete newData[categorySlug]
      return newData
    })
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[categorySlug]
      return newErrors
    })
  }, [])

  const getCategoryData = useCallback((categorySlug) => {
    return categoryData[categorySlug] || []
  }, [categoryData])

  const isLoading = useCallback((categorySlug) => {
    return loadingStates[categorySlug] || false
  }, [loadingStates])

  const getError = useCallback((categorySlug) => {
    return errors[categorySlug] || null
  }, [errors])

  return {
    categoryData,
    loadCategoryData,
    clearCategoryData,
    getCategoryData,
    isLoading,
    getError
  }
}
