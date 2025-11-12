# Guía de Despliegue - map.livestellar.com

## Problema: ERR_CONNECTION_REFUSED

Este error típicamente significa que:
1. Nginx/Apache no está corriendo
2. Nginx/Apache no está configurado para el dominio
3. El firewall está bloqueando los puertos 80/443

## Pasos para resolver:

### 1. Conectarse al servidor
```bash
ssh root@134.209.216.156
# Contraseña: 17&\WW#qO53Z
```

### 2. Verificar que Nginx está instalado y corriendo
```bash
# Verificar si Nginx está instalado
nginx -v

# Si no está instalado, instalarlo:
# Ubuntu/Debian:
apt update && apt install nginx -y

# Verificar el estado de Nginx
systemctl status nginx

# Si no está corriendo, iniciarlo:
systemctl start nginx
systemctl enable nginx  # Para que inicie automáticamente al reiniciar
```

### 3. Verificar los archivos están en el lugar correcto
```bash
# Verificar que los archivos están en /var/www/html
ls -la /var/www/html

# Deberías ver:
# - index.html
# - assets/ (directorio con los archivos JS y CSS)
```

### 4. Crear configuración de Nginx para el dominio

Crear el archivo de configuración:
```bash
nano /etc/nginx/sites-available/map.livestellar.com
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name map.livestellar.com;

    root /var/www/html;
    index index.html;

    # Servir archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Comprimir archivos
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 5. Habilitar el sitio
```bash
# Crear enlace simbólico
ln -s /etc/nginx/sites-available/map.livestellar.com /etc/nginx/sites-enabled/

# Verificar la configuración de Nginx
nginx -t

# Si todo está bien, recargar Nginx
systemctl reload nginx
```

### 6. Verificar firewall
```bash
# Verificar si hay un firewall activo (ufw)
ufw status

# Si está activo, permitir puertos HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# O si usa iptables directamente:
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 7. Verificar que el DNS apunta correctamente
```bash
# Verificar que el dominio apunta a la IP correcta
nslookup map.livestellar.com

# Debería mostrar: 134.209.216.156
```

## Comandos útiles para debugging:

```bash
# Ver logs de Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Verificar qué procesos están escuchando en los puertos
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# O con ss:
ss -tlnp | grep :80
```

## Si sigue sin funcionar:

1. **Verificar permisos de archivos:**
```bash
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
```

2. **Verificar si hay otro servidor web corriendo:**
```bash
# Verificar Apache (si está instalado)
systemctl status apache2
# Si está corriendo, detenerlo o cambiar el puerto
systemctl stop apache2
```

3. **Verificar SELinux (si aplica):**
```bash
# En CentOS/RHEL
sestatus
# Si está activo, puede necesitar ajustes
```

## Nota sobre SSL/HTTPS (opcional para más adelante):

Una vez que funcione HTTP, puedes agregar SSL con Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d map.livestellar.com
```

