#!/bin/bash

# Script de configuración del servidor para map.livestellar.com
# Ejecutar con: bash setup-server.sh
# O dar permisos de ejecución: chmod +x setup-server.sh && ./setup-server.sh

echo "=== Configurando servidor para map.livestellar.com ==="

# 1. Actualizar sistema
echo "1. Actualizando sistema..."
apt update -y

# 2. Instalar Nginx si no está instalado
echo "2. Verificando/Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    echo "Nginx instalado"
else
    echo "Nginx ya está instalado"
fi

# 3. Iniciar y habilitar Nginx
echo "3. Iniciando Nginx..."
systemctl start nginx
systemctl enable nginx

# 4. Verificar permisos de archivos
echo "4. Ajustando permisos..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 5. Crear configuración de Nginx
echo "5. Creando configuración de Nginx..."
cat > /etc/nginx/sites-available/map.livestellar.com << 'EOF'
server {
    listen 80;
    server_name map.livestellar.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    access_log /var/log/nginx/map.livestellar.com.access.log;
    error_log /var/log/nginx/map.livestellar.com.error.log;
}
EOF

# 6. Habilitar el sitio
echo "6. Habilitando sitio..."
# Eliminar enlace simbólico si existe
rm -f /etc/nginx/sites-enabled/map.livestellar.com
# Crear nuevo enlace
ln -s /etc/nginx/sites-available/map.livestellar.com /etc/nginx/sites-enabled/

# Eliminar configuración por defecto si existe
rm -f /etc/nginx/sites-enabled/default

# 7. Verificar configuración de Nginx
echo "7. Verificando configuración de Nginx..."
if nginx -t; then
    echo "✓ Configuración de Nginx válida"
else
    echo "✗ Error en la configuración de Nginx"
    exit 1
fi

# 8. Recargar Nginx
echo "8. Recargando Nginx..."
systemctl reload nginx

# 9. Configurar firewall
echo "9. Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "Puertos 80 y 443 abiertos en UFW"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "Puertos 80 y 443 abiertos en firewalld"
else
    echo "⚠ No se encontró firewall. Puede necesitar configuración manual."
fi

# 10. Verificar estado final
echo "10. Verificando estado..."
echo ""
echo "Estado de Nginx:"
systemctl status nginx --no-pager -l

echo ""
echo "=== Configuración completada ==="
echo ""
echo "Verifica que los archivos estén en /var/www/html:"
echo "  ls -la /var/www/html"
echo ""
echo "Verifica los logs si hay problemas:"
echo "  tail -f /var/log/nginx/error.log"
echo ""
echo "Verifica que Nginx esté escuchando:"
echo "  netstat -tlnp | grep :80"
echo ""
echo "Prueba acceder a: http://map.livestellar.com"

