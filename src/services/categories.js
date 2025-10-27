import { supabase } from '../config/supabase'

/**
 * Obtener todas las categorías activas
 * @returns {Promise<Array>} Lista de categorías
 */
export const getAllCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error }
  }
}

/**
 * Obtener una categoría por ID
 * @param {string} id - ID de la categoría
 * @returns {Promise<Object>} Categoría
 */
export const getCategoryById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching category:', error)
    return { data: null, error }
  }
}
