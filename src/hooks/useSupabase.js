import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export const useSupabase = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Test connection by fetching from a simple table
        const { data, error } = await supabase
          .from('properties') // Assuming you have a properties table
          .select('*')
          .limit(1)
        
        if (error) {
          console.warn('Supabase connection test failed:', error.message)
          // Don't set error for missing table, just log it
          if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
            setError(error.message)
          }
        } else {
          console.log('Supabase connected successfully')
        }
        
        setIsConnected(true)
      } catch (err) {
        console.error('Supabase connection error:', err)
        setError(err.message)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  return {
    supabase,
    isConnected,
    loading,
    error
  }
}

