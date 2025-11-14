#!/bin/bash

# Script para configurar SSL Wildcard - Ejecutar en tu terminal local
# Se conectará al servidor y ejecutará todos los pasos automáticamente

echo "🚀 Configurando SSL Wildcard en Dokploy..."
echo ""

# Conectar por SSH y ejecutar comandos
ssh root@144.126.132.159 << 'ENDSSH'

set -e

echo "✓ Conectado al servidor"
echo ""

# Paso 1: Ir a directorio Dokploy
echo "📁 Accediendo a /etc/dokploy..."
cd /etc/dokploy

# Paso 2: Crear backups
echo "💾 Creando backups..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp traefik/traefik.yml traefik/traefik.yml.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo "✓ Backups creados"
echo ""

# Paso 3: Verificar si ya existe CF_DNS_API_TOKEN
echo "🔧 Verificando docker-compose.yml..."
if grep -q "CF_DNS_API_TOKEN" docker-compose.yml; then
    echo "⚠️  CF_DNS_API_TOKEN ya existe, omitiendo..."
else
    echo "⚠️  NOTA: Necesitas agregar manualmente CF_DNS_API_TOKEN"
    echo "   Edita docker-compose.yml y agrega en el servicio traefik:"
    echo "   environment:"
    echo "     - CF_DNS_API_TOKEN=0uZCx04NaVsRh57Luc_FnBjmDL_Qj30ZYZ4abM7k"
fi
echo ""

# Paso 4: Agregar certResolver
echo "🔐 Configurando certResolver letsencrypt-dns..."
if grep -q "letsencrypt-dns" traefik/traefik.yml; then
    echo "✓ certResolver letsencrypt-dns ya existe"
else
    cat >> traefik/traefik.yml << 'EOF'

# Wildcard SSL Certificate Resolver con Cloudflare DNS Challenge
certificatesResolvers:
  letsencrypt-dns:
    acme:
      email: juliobonifacio53@gmail.com
      storage: /etc/dokploy/traefik/acme-dns.json
      dnsChallenge:
        provider: cloudflare
        delayBeforeCheck: 30
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
EOF
    echo "✓ certResolver agregado"
fi
echo ""

# Paso 5: Crear archivo acme-dns.json
echo "📝 Creando acme-dns.json..."
touch traefik/acme-dns.json
chmod 600 traefik/acme-dns.json
echo "✓ Archivo creado"
echo ""

# Paso 6: Mostrar traefik.yml
echo "📋 Contenido de traefik.yml (últimas 15 líneas):"
tail -n 15 traefik/traefik.yml
echo ""

echo "=================================================="
echo "✅ Configuración del servidor completada"
echo "=================================================="
echo ""
echo "AHORA debes agregar CF_DNS_API_TOKEN manualmente:"
echo ""
echo "1. Ejecuta: nano /etc/dokploy/docker-compose.yml"
echo ""
echo "2. Busca el servicio 'traefik' y en 'environment:' agrega:"
echo "     - CF_DNS_API_TOKEN=0uZCx04NaVsRh57Luc_FnBjmDL_Qj30ZYZ4abM7k"
echo ""
echo "3. Guarda: Ctrl+O, Enter, Ctrl+X"
echo ""
echo "4. Ejecuta: docker-compose restart traefik"
echo ""

ENDSSH

echo ""
echo "🎉 Script ejecutado. Sigue las instrucciones de arriba."
