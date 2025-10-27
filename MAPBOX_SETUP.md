# Configuración de Mapbox para LiveStellar Map

## Instalación de Dependencias

Para habilitar el mapa interactivo real, ejecuta los siguientes comandos:

```bash
# Instalar dependencias de Mapbox
npm install react-map-gl mapbox-gl --legacy-peer-deps

# O si tienes problemas de permisos:
sudo chown -R 501:20 "/Users/javierrojas/.npm"
npm install react-map-gl mapbox-gl
```

## Configuración de Mapbox

1. **Crear cuenta en Mapbox:**
   - Ve a [mapbox.com](https://www.mapbox.com)
   - Crea una cuenta gratuita
   - Obtén tu token de acceso público

2. **Configurar el token:**
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega: `VITE_MAPBOX_TOKEN=tu_token_aqui`

3. **Reemplazar el mapa placeholder:**
   - El componente actual usa un placeholder
   - Reemplaza con el componente Mapbox real cuando tengas el token

## Funcionalidades Implementadas

✅ **Sistema de Login completo**
✅ **Dashboard con layout idéntico a la imagen**
✅ **Panel lateral de Data Layers**
✅ **Barra de búsqueda superior**
✅ **Sistema de capas interactivas**
✅ **Marcadores simulados en el mapa**
✅ **Controles de zoom**
✅ **Filtros de pipeline**
✅ **Toggle switches funcionales**

## Próximos Pasos

1. Instalar dependencias de Mapbox
2. Configurar token de Mapbox
3. Reemplazar placeholder con mapa real
4. Conectar capas de datos con el mapa
5. Implementar búsqueda geográfica


