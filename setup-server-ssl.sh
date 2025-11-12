#!/bin/bash

# Script de configuración completa del servidor con SSL para map.livestellar.com
# Ejecutar en el servidor: bash setup-server-ssl.sh

set -e  # Salir si hay error

echo "=== Configurando servidor para map.livestellar.com con SSL ==="

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

# 5. Verificar que los archivos estén presentes
echo "5. Verificando archivos en /var/www/html..."
if [ ! -f "/var/www/html/index.html" ]; then
    echo "⚠ ADVERTENCIA: No se encontró index.html en /var/www/html"
    echo "Por favor asegúrate de haber subido los archivos del build (dist/)"
    ls -la /var/www/html
fi

# 6. Crear configuración inicial de Nginx (HTTP - necesaria para Let's Encrypt)
echo "6. Creando configuración inicial de Nginx..."
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
}
EOF

# 7. Habilitar el sitio
echo "7. Habilitando sitio..."
rm -f /etc/nginx/sites-enabled/map.livestellar.com
ln -s /etc/nginx/sites-available/map.livestellar.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 8. Verificar configuración de Nginx
echo "8. Verificando configuración de Nginx..."
if nginx -t; then
    echo "✓ Configuración de Nginx válida"
else
    echo "✗ Error en la configuración de Nginx"
    exit 1
fi

# 9. Recargar Nginx
echo "9. Recargando Nginx..."
systemctl reload nginx

# 10. Configurar firewall
echo "10. Configurando firewall..."
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
    echo "⚠ No se encontró firewall. Verificando iptables..."
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
fi

# 11. Instalar Certbot para SSL
echo "11. Instalando Certbot para SSL..."
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo "Certbot instalado"
else
    echo "Certbot ya está instalado"
fi

# 12. Obtener certificado SSL
echo "12. Obteniendo certificado SSL de Let's Encrypt..."
echo "Esto puede tomar unos momentos..."
certbot --nginx -d map.livestellar.com --non-interactive --agree-tos --email admin@livestellar.com --redirect || {
    echo "⚠ Error al obtener el certificado SSL"
    echo "Verifica que:"
    echo "  1. El dominio map.livestellar.com apunta a esta IP (134.209.216.156)"
    echo "  2. El puerto 80 está accesible desde internet"
    echo ""
    echo "Puedes verificar el DNS con: nslookup map.livestellar.com"
    exit 1
}

# 13. Verificar renovación automática
echo "13. Configurando renovación automática de SSL..."
# Certbot crea automáticamente un cron job, pero verificamos
systemctl enable certbot.timer || true

# 14. Verificar estado final
echo ""
echo "=== Configuración completada ==="
echo ""
echo "✓ Nginx configurado y corriendo"
echo "✓ SSL/HTTPS configurado para map.livestellar.com"
echo ""
echo "Verifica el estado:"
echo "  systemctl status nginx"
echo ""
echo "Verifica los logs si hay problemas:"
echo "  tail -f /var/log/nginx/error.log"
echo ""
echo "El sitio debería estar disponible en: https://map.livestellar.com"
echo ""
echo "Para verificar el certificado SSL:"
echo "  certbot certificates"

