#!/bin/bash

# Script de configuración inicial del VPS
# Ejecutar este script una vez en el VPS para configurar el entorno

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuración Inicial del VPS para Krono Fichaje ===${NC}"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js no está instalado. Instalando Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}Node.js instalado${NC}"
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}Node.js ya está instalado: $NODE_VERSION${NC}"
fi

echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 no está instalado. Instalando PM2...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 instalado${NC}"
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}PM2 ya está instalado: v$PM2_VERSION${NC}"
fi

echo ""

# Verificar si MySQL está accesible
echo -e "${YELLOW}Verificando acceso a MySQL...${NC}"
if docker ps | grep -q "krono_mysql"; then
    echo -e "${GREEN}Contenedor MySQL está corriendo${NC}"
else
    echo -e "${RED}Advertencia: Contenedor MySQL no está corriendo${NC}"
    echo "Asegúrate de que el contenedor krono_mysql esté activo antes de continuar"
fi

echo ""
echo -e "${GREEN}=== Configuración Inicial Completada ===${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Configurar variables de entorno en .env.production"
echo "2. Ejecutar scripts/setup-db.sh para configurar la base de datos"
echo "3. Ejecutar scripts/deploy.sh para desplegar la aplicación"

