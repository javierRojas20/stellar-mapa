#!/bin/bash

# Script para conectarse al servidor y ejecutar la configuración
# Este script requiere sshpass (apt install sshpass -y o brew install hudochenkov/sshpass/sshpass)

SERVER_IP="134.209.216.156"
SERVER_USER="root"
SERVER_PASS="17&\\WW#qO53Z"
DOMAIN="map.livestellar.com"

echo "=== Conectando y configurando servidor ==="

# Verificar si sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "Error: sshpass no está instalado."
    echo "Instala con:"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo "  Linux: apt install sshpass -y"
    echo ""
    echo "O ejecuta manualmente en el servidor:"
    echo "  ssh root@${SERVER_IP}"
    echo "  bash <(curl -s) o sube setup-server-ssl.sh"
    exit 1
fi

echo "Conectando a ${SERVER_USER}@${SERVER_IP}..."

# Subir el script de configuración y ejecutarlo
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no setup-server-ssl.sh ${SERVER_USER}@${SERVER_IP}:/tmp/setup-server-ssl.sh

if [ $? -eq 0 ]; then
    echo "Script subido. Ejecutando configuración..."
    sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/setup-server-ssl.sh && /tmp/setup-server-ssl.sh"
else
    echo "Error al subir el script. Intentando ejecución directa..."
    # Intentar ejecutar comandos directamente
    sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        apt update -y
        apt install nginx certbot python3-certbot-nginx -y
        systemctl start nginx
        systemctl enable nginx
        
        cat > /etc/nginx/sites-available/map.livestellar.com << 'EOF'
server {
    listen 80;
    server_name map.livestellar.com;
    root /var/www/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
        
        ln -sf /etc/nginx/sites-available/map.livestellar.com /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl reload nginx
        
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        certbot --nginx -d map.livestellar.com --non-interactive --agree-tos --email admin@livestellar.com --redirect
        
        echo "Configuración completada!"
ENDSSH
fi

echo ""
echo "=== Proceso completado ==="
echo "Verifica en: https://${DOMAIN}"

