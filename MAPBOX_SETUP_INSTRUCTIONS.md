# Configuración de Mapbox para LiveStellar Map

## 🔑 **Configurar tu Key de Mapbox**

### Paso 1: Obtener tu Key
1. Ve a [mapbox.com](https://www.mapbox.com)
2. Crea una cuenta gratuita o inicia sesión
3. Ve a tu dashboard y copia tu **Public Access Token**

### Paso 2: Configurar la Key
Reemplaza la key en el archivo `src/config/mapbox.js`:

```javascript
// Cambia esta línea:
export const MAPBOX_TOKEN = 'tu_key_de_mapbox_aqui';

// Por tu key real:
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiTU5VU0VSIiwiYSI6ImNwZXJzb25hbGl6ZWQifQ...';
```

### Paso 3: Verificar Funcionamiento
1. Guarda el archivo
2. Recarga la página en el navegador
3. Deberías ver un mapa de satélite real de Florida

## 🗺️ **Funcionalidades del Mapa**

### ✅ **Mapa de Satélite Real:**
- Imágenes satelitales reales de Florida
- Zoom y pan interactivos
- Marcadores de propiedades clickeables
- Círculo de radio de 5 millas

### ✅ **Marcadores Interactivos:**
- Círculos rojos con números
- Click para ver detalles del deal
- Hover effects

### ✅ **Análisis de Radio:**
- Círculo azul de 5 millas
- Datos agregados en el sidebar
- Coordenadas del centro

## 🚀 **Beneficios del Mapa Real**

1. **Imágenes Satelitales:** Vista real de Florida
2. **Interactividad:** Zoom, pan, y navegación
3. **Precisión:** Coordenadas exactas
4. **Profesional:** Apariencia de aplicación empresarial
5. **Escalable:** Fácil agregar más funcionalidades

## 🔧 **Solución de Problemas**

### Si el mapa no carga:
1. Verifica que tu key de Mapbox sea correcta
2. Asegúrate de que tu key tenga permisos públicos
3. Revisa la consola del navegador para errores

### Si los marcadores no aparecen:
1. Verifica que las coordenadas sean correctas
2. Asegúrate de que el mapa esté completamente cargado

¡Con Mapbox tendrás un mapa profesional y realista! 🎉


