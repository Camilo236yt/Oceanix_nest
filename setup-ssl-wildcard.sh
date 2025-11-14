#!/bin/bash

# Script para configurar SSL Wildcard con Cloudflare DNS Challenge en Dokploy
# Autor: Claude Code
# Fecha: 2025-01-10

set -e

echo "=================================================="
echo "  Configuración SSL Wildcard para Dokploy"
echo "=================================================="
echo ""

# Variables
CF_TOKEN="0uZCx04NaVsRh57Luc_FnBjmDL_Qj30ZYZ4abM7k"
EMAIL="juliobonifacio53@gmail.com"

echo "✓ Token de Cloudflare: ${CF_TOKEN:0:20}..."
echo "✓ Email: $EMAIL"
echo ""

# Paso 1: Verificar que estamos en el directorio correcto
echo "📁 Paso 1: Verificando directorio de Dokploy..."
if [ ! -d "/etc/dokploy" ]; then
    echo "❌ Error: Directorio /etc/dokploy no encontrado"
    exit 1
fi
cd /etc/dokploy
echo "✓ Directorio encontrado"
echo ""

# Paso 2: Backup de archivos existentes
echo "💾 Paso 2: Creando backups..."
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Backup de docker-compose.yml creado"
fi

if [ -f "traefik/traefik.yml" ]; then
    cp traefik/traefik.yml traefik/traefik.yml.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Backup de traefik.yml creado"
fi
echo ""

# Paso 3: Agregar variable de entorno CF_DNS_API_TOKEN
echo "🔧 Paso 3: Configurando variable de entorno en docker-compose.yml..."

# Verificar si ya existe la variable
if grep -q "CF_DNS_API_TOKEN" docker-compose.yml; then
    echo "⚠️  Variable CF_DNS_API_TOKEN ya existe, actualizando..."
    sed -i "s/CF_DNS_API_TOKEN=.*/CF_DNS_API_TOKEN=$CF_TOKEN/" docker-compose.yml
else
    # Buscar la sección de traefik y agregar la variable
    # Esto es complicado, mejor hacerlo manualmente o con un enfoque más seguro
    echo "⚠️  Necesitas agregar manualmente la variable CF_DNS_API_TOKEN"
    echo "    Edita: /etc/dokploy/docker-compose.yml"
    echo "    Busca el servicio 'traefik' y agrega en 'environment':"
    echo "      - CF_DNS_API_TOKEN=$CF_TOKEN"
    echo ""
    echo "    Presiona ENTER cuando lo hayas agregado..."
    read -r
fi
echo ""

# Paso 4: Configurar certResolver con DNS challenge
echo "🔐 Paso 4: Configurando certResolver letsencrypt-dns..."

# Verificar si traefik.yml existe
if [ ! -f "traefik/traefik.yml" ]; then
    echo "❌ Error: /etc/dokploy/traefik/traefik.yml no encontrado"
    exit 1
fi

# Verificar si ya existe el certResolver
if grep -q "letsencrypt-dns" traefik/traefik.yml; then
    echo "⚠️  certResolver letsencrypt-dns ya existe"
else
    # Agregar el certResolver al final del archivo
    cat >> traefik/traefik.yml << EOF

# Wildcard SSL Certificate Resolver con Cloudflare DNS Challenge
certificatesResolvers:
  letsencrypt-dns:
    acme:
      email: $EMAIL
      storage: /etc/dokploy/traefik/acme-dns.json
      dnsChallenge:
        provider: cloudflare
        delayBeforeCheck: 30
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
EOF
    echo "✓ certResolver letsencrypt-dns agregado"
fi
echo ""

# Paso 5: Crear archivo acme-dns.json si no existe
echo "📝 Paso 5: Creando archivo acme-dns.json..."
if [ ! -f "traefik/acme-dns.json" ]; then
    touch traefik/acme-dns.json
    chmod 600 traefik/acme-dns.json
    echo "✓ Archivo acme-dns.json creado"
else
    echo "✓ Archivo acme-dns.json ya existe"
fi
echo ""

# Paso 6: Mostrar archivos modificados
echo "📋 Paso 6: Verificando configuración..."
echo ""
echo "=== Contenido de traefik.yml (últimas 15 líneas) ==="
tail -n 15 traefik/traefik.yml
echo ""

# Paso 7: Reiniciar Traefik
echo "🔄 Paso 7: Reiniciando Traefik..."
echo "⚠️  Esto reiniciará el servicio de Traefik"
echo "    Presiona ENTER para continuar o Ctrl+C para cancelar..."
read -r

docker-compose restart traefik
echo "✓ Traefik reiniciado"
echo ""

# Paso 8: Verificar que Traefik está corriendo
echo "🔍 Paso 8: Verificando estado de Traefik..."
sleep 5
if docker-compose ps traefik | grep -q "Up"; then
    echo "✓ Traefik está corriendo correctamente"
else
    echo "❌ Error: Traefik no está corriendo"
    echo "Ver logs con: docker-compose logs traefik"
    exit 1
fi
echo ""

# Paso 9: Instrucciones finales
echo "=================================================="
echo "  ✅ Configuración completada"
echo "=================================================="
echo ""
echo "SIGUIENTE PASO:"
echo "1. Ve a Dokploy UI → Advanced → Traefik → Modify"
echo "2. Busca el router 'oceanix-wildcard-router-websecure'"
echo "3. Cambia:"
echo "     certResolver: letsencrypt"
echo "   Por:"
echo "     certResolver: letsencrypt-dns"
echo "4. Click en 'Update'"
echo ""
echo "5. Espera 2-5 minutos para que se generen los certificados"
echo "6. Prueba: https://test.oceanix.space"
echo ""
echo "Para ver logs de Traefik:"
echo "  docker-compose logs -f traefik"
echo ""
