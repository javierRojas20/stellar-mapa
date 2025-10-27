import { useState, useEffect } from 'react'
import { getAllCategories } from '../services/categories'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error: fetchError } = await getAllCategories()
        
        if (fetchError) {
          throw fetchError
        }
        
        setCategories(data || [])
      } catch (err) {
        console.error('Error loading categories:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}
