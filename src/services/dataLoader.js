import { supabase } from '../config/supabase'

/**
 * Cargar datos de cualquier tabla dinámicamente
 * @param {string} tableName - Nombre de la tabla (usando category.slug)
 * @returns {Promise<Object>} Datos y error
 */
export const loadTableData = async (tableName) => {
  try {
    console.log(`🔍 Attempting to load data from table: "${tableName}"`)
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')

    console.log(`📊 Query result for "${tableName}":`, { data, error })

    if (error) {
      console.error(`❌ Supabase error for table "${tableName}":`, error)
      throw error
    }
    
      console.log(`✅ Successfully loaded ${data?.length || 0} records from "${tableName}"`)
      
      // Debug: Mostrar estructura de los primeros registros para hospitales
      if (tableName === 'hospitals' && data && data.length > 0) {
        console.log(`🏥 Sample hospital record:`, data[0])
        console.log(`🏥 Available fields:`, Object.keys(data[0]))
        console.log(`🏥 First 3 hospitals:`, data.slice(0, 3))
        
        // Verificar campos de coordenadas específicamente
        const firstHospital = data[0];
        console.log(`🏥 Coordinate fields check:`);
        console.log(`  - latitude:`, firstHospital.latitude);
        console.log(`  - longitude:`, firstHospital.longitude);
        console.log(`  - lat:`, firstHospital.lat);
        console.log(`  - lng:`, firstHospital.lng);
        console.log(`  - lon:`, firstHospital.lon);
        console.log(`  - name:`, firstHospital.name);
      }
      
      return { data, error: null }
  } catch (error) {
    console.error(`💥 Error loading data from ${tableName}:`, error)
    return { data: null, error }
  }
}

/**
 * Cargar datos con filtros específicos
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} filters - Filtros a aplicar
 * @returns {Promise<Object>} Datos y error
 */
export const loadTableDataWithFilters = async (tableName, filters = {}) => {
  try {
    let query = supabase.from(tableName).select('*')
    
    // Aplicar filtros dinámicamente
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value)
      }
    })
    
    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error(`Error loading filtered data from ${tableName}:`, error)
    return { data: null, error }
  }
}

/**
 * Función de prueba para verificar acceso a tablas específicas
 * @param {string} tableName - Nombre de la tabla a probar
 * @returns {Promise<Object>} Resultado de la prueba
 */
export const testTableAccess = async (tableName) => {
  try {
    console.log(`🧪 Testing access to table: "${tableName}"`)
    
    // Primero intentamos obtener la estructura de la tabla
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(10) // Aumentamos el límite para ver más registros

    if (error) {
      console.error(`❌ Cannot access table "${tableName}":`, error.message)
      return {
        accessible: false,
        error: error.message,
        suggestion: getTableErrorSuggestion(error.message, tableName)
      }
    }

    console.log(`✅ Table "${tableName}" is accessible`)
    return {
      accessible: true,
      recordCount: data?.length || 0,
      sampleData: data
    }
  } catch (error) {
    console.error(`💥 Error testing table "${tableName}":`, error)
    return {
      accessible: false,
      error: error.message,
      suggestion: 'Check table name and permissions'
    }
  }
}

/**
 * Función para probar acceso con diferentes esquemas
 */
export const testTableWithSchema = async (tableName, schema = 'public') => {
  try {
    console.log(`🧪 Testing access to table: "${schema}.${tableName}"`)
    
    const { data, error } = await supabase
      .from(`${schema}.${tableName}`)
      .select('*')
      .limit(5)

    if (error) {
      console.error(`❌ Cannot access table "${schema}.${tableName}":`, error.message)
      return {
        accessible: false,
        error: error.message,
        suggestion: getTableErrorSuggestion(error.message, tableName)
      }
    }

    console.log(`✅ Table "${schema}.${tableName}" is accessible with ${data?.length || 0} records`)
    return {
      accessible: true,
      recordCount: data?.length || 0,
      sampleData: data
    }
  } catch (error) {
    console.error(`💥 Error testing table "${schema}.${tableName}":`, error)
    return {
      accessible: false,
      error: error.message,
      suggestion: 'Check table name and permissions'
    }
  }
}

/**
 * Sugerencias basadas en el tipo de error
 */
const getTableErrorSuggestion = (errorMessage, tableName) => {
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    return `Table "${tableName}" does not exist. Check if the table name is correct.`
  }
  if (errorMessage.includes('permission denied')) {
    return `Permission denied for table "${tableName}". Check RLS policies in Supabase.`
  }
  if (errorMessage.includes('JWT')) {
    return 'Authentication issue. Check your Supabase credentials.'
  }
  return `Unknown error with table "${tableName}". Check Supabase logs for details.`
}

/**
 * Función para probar múltiples nombres de tabla comunes
 * @returns {Promise<Object>} Resultado de las pruebas
 */
export const testCommonTables = async () => {
  const commonTableNames = [
    'hospitals',
    'hospital', 
    'healthcare',
    'healthcare_facilities',
    'medical_facilities',
    'health_facilities',
    'facilities',
    'locations',
    'places'
  ];

  console.log('🔍 Testing common table names...');
  const results = {};

  for (const tableName of commonTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      results[tableName] = {
        exists: !error,
        accessible: !error,
        recordCount: data?.length || 0,
        error: error?.message || null
      };

      if (!error) {
        console.log(`✅ Table "${tableName}" found with ${data?.length || 0} records`);
      } else {
        console.log(`❌ Table "${tableName}" not accessible: ${error.message}`);
      }
    } catch (err) {
      results[tableName] = {
        exists: false,
        accessible: false,
        recordCount: 0,
        error: err.message
      };
      console.log(`💥 Error testing "${tableName}": ${err.message}`);
    }
  }

  return results;
}

/**
 * Función para agregar datos de prueba a la tabla hospitals
 * @returns {Promise<Object>} Resultado de la inserción
 */
export const addSampleHospitals = async () => {
  try {
    console.log('🏥 Adding sample hospitals data...');
    
    const sampleHospitals = [
      {
        nombre: 'Orlando Health',
        tipo: 'Hospital',
        direccion: '1414 Kuhl Ave, Orlando, FL',
        latitud: 28.5383,
        longitud: -81.5158,
        estado: 'Activo',
        unidades: 1,
        acres: 25.0,
        precio: 150000000,
        producto: 'Healthcare',
        estrategia: 'Medical Hub',
        habitaciones: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nombre: 'Windermere Medical',
        tipo: 'Clinic',
        direccion: '1234 Main St, Windermere, FL',
        latitud: 28.5383,
        longitud: -81.3789,
        estado: 'Activo',
        unidades: 1,
        acres: 2.5,
        precio: 8000000,
        producto: 'Healthcare',
        estrategia: 'Community Care',
        habitaciones: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nombre: 'Lake Nona Medical City',
        tipo: 'Medical Complex',
        direccion: '6900 Tavistock Lakes Blvd, Orlando, FL',
        latitud: 28.5200,
        longitud: -81.4500,
        estado: 'Activo',
        unidades: 1,
        acres: 50.0,
        precio: 500000000,
        producto: 'Healthcare',
        estrategia: 'Medical City',
        habitaciones: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('hospitals')
      .insert(sampleHospitals)
      .select();

    if (error) {
      console.error('❌ Error inserting sample hospitals:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} sample hospitals`);
    return { success: true, data, count: data?.length || 0 };
  } catch (err) {
    console.error('💥 Error adding sample hospitals:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Función para crear una categoría para hospitales
 * @returns {Promise<Object>} Resultado de la creación
 */
export const createHospitalsCategory = async () => {
  try {
    console.log('🏥 Creating hospitals category...');
    
    const categoryData = {
      nombre: 'Hospitals',
      slug: 'hospitals',
      color: '#e53e3e', // Rojo para hospitales
      icon: '🏥',
      status: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating hospitals category:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Successfully created hospitals category:`, data);
    return { success: true, data, category: data };
  } catch (err) {
    console.error('💥 Error creating hospitals category:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Función genérica para obtener detalles de cualquier categoría por ID
 * @param {string} categorySlug - Slug de la categoría (ej: 'hospitals', 'schools', 'subdivisions')
 * @param {number} itemId - ID del item
 * @returns {Promise<Object>} Detalles del item
 */
export const getItemDetailsById = async (categorySlug, itemId) => {
  try {
    console.log(`🔍 Fetching ${categorySlug} details for ID: ${itemId}`);
    
    // Mapear slugs a nombres de función RPC
      const rpcFunctionMap = {
        'hospitals': 'get_hospital_by_id',
        'schools': 'get_school_by_id',
        'subdivisions': 'get_subdivision_by_id',
        'masterPlans': 'get_masterplan_details', // Corregido: usar get_masterplan_details
        'masterplans': 'get_masterplan_details', // Corregido: usar get_masterplan_details
        'publixLocations': 'get_publix_by_id',
        'publix': 'get_publix_by_id', // Agregar 'publix' como alias
        'rentComps': 'get_rent_by_id', // Cambiado: usar get_rent_by_id para tabla 'rent'
        'rent': 'get_rent_by_id', // Agregar 'rent' como alias
        'rents': 'get_rent_by_id', // Agregar 'rents' como alias
        'landParcels': 'get_land_details', // Cambiado: usar get_land_details para tabla 'land'
        'land': 'get_land_details' // Agregar 'land' como alias
      };
    
    const rpcFunction = rpcFunctionMap[categorySlug];
    if (!rpcFunction) {
      console.warn(`⚠️ No RPC function found for category: ${categorySlug}`);
      return { success: false, error: `No RPC function found for category: ${categorySlug}` };
    }
    
    // Construir parámetros dinámicamente
    // Mapeo especial para categorías con nombres diferentes
    const paramMap = {
      'publix': 'publix_id',
      'publixLocations': 'publix_id',
      'rentComps': 'rent_id', // Cambiado: usar rent_id para tabla 'rent'
      'rent': 'rent_id', // Agregar 'rent' como alias
      'rents': 'rent_id', // Agregar 'rents' como alias
      'landParcels': 'id', // Cambiado: usar id para tabla 'land'
      'land': 'id', // Agregar 'land' como alias
      'masterPlans': 'id', // get_masterplan_details usa 'id' como parámetro
      'masterplans': 'id' // get_masterplan_details usa 'id' como parámetro
    };
    
    const paramName = paramMap[categorySlug] || `${categorySlug.slice(0, -1)}_id`;
    const params = {
      [paramName]: itemId
    };
    
    const { data, error } = await supabase.rpc(rpcFunction, params);
    
    if (error) {
      console.error(`❌ Error fetching ${categorySlug} details:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ ${categorySlug} details loaded:`, data);
    
    // Extraer datos del item
    const itemData = data?.[0] || data;
    let itemDetails = { ...itemData };
    
    // Si hay datos en props, parsearlos
    if (itemData?.props) {
      try {
        const propsData = JSON.parse(itemData.props);
        itemDetails = {
          ...itemData,
          ...propsData,
          // Mapear campos específicos según la categoría
          name: propsData.name || itemData.name,
          address: propsData.address || itemData.address
        };
        
        // Mapeos específicos por categoría
        if (categorySlug === 'hospitals') {
          itemDetails.leapfrog_grade = propsData.leapfrog_grade || propsData.grade || itemData.rating || 'N/A';
        } else if (categorySlug === 'schools') {
          itemDetails.school_type = propsData.school_type || propsData.type || 'N/A';
          itemDetails.district = propsData.district || propsData.school_district || 'N/A';
        } else if (categorySlug === 'subdivisions') {
          itemDetails.developer = propsData.developer || itemData.developer || 'N/A';
          itemDetails.product_type = propsData.product_type || propsData.product || 'N/A';
        }
        
      } catch (error) {
        console.warn('⚠️ Could not parse props data:', error);
      }
    }
    
    return { 
      success: true, 
      data: itemDetails, 
      [categorySlug.slice(0, -1)]: itemDetails // hospitals -> hospital, schools -> school, etc.
    };
  } catch (err) {
    console.error(`💥 Error fetching ${categorySlug} details:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Función para obtener detalles de un hospital por ID (mantener compatibilidad)
 * @param {number} hospitalId - ID del hospital
 * @returns {Promise<Object>} Detalles del hospital
 */
export const getHospitalById = async (hospitalId) => {
  return await getItemDetailsById('hospitals', hospitalId);
}
