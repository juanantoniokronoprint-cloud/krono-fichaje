#!/bin/bash

# Script para desplegar la aplicación en el VPS
# Ejecutar desde el directorio raíz del proyecto

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_HOST="54.37.158.9"
VPS_USER="debian"
VPS_PATH="/opt/krono-fichaje"

echo -e "${GREEN}=== Despliegue a VPS ===${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Debes ejecutar este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

echo -e "${YELLOW}Paso 1: Sincronizando archivos con el VPS...${NC}"
rsync -avz --exclude 'node_modules' \
           --exclude '.next' \
           --exclude '.git' \
           --exclude '.gitignore' \
           --exclude '.env.local' \
           --exclude '.env.production' \
           --exclude 'logs' \
           -e ssh \
           ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo -e "${GREEN}Archivos sincronizados${NC}"
echo ""

echo -e "${YELLOW}Paso 2: Ejecutando configuración inicial en VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && chmod +x scripts/*.sh && bash scripts/setup-vps.sh"

echo -e "${GREEN}Configuración inicial completada${NC}"
echo ""

echo -e "${YELLOW}Paso 3: Configurando base de datos...${NC}"
echo -e "${YELLOW}IMPORTANTE: Necesitas configurar las variables de entorno antes de continuar${NC}"
echo -e "${YELLOW}Ejecuta en el VPS:${NC}"
echo "  ssh ${VPS_USER}@${VPS_HOST}"
echo "  cd ${VPS_PATH}"
echo "  cp .env.production.example .env.production"
echo "  nano .env.production  # Editar con tus credenciales de BD"
echo ""
read -p "¿Ya configuraste las variables de entorno? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Por favor configura las variables de entorno y ejecuta este script nuevamente${NC}"
    exit 1
fi

echo -e "${YELLOW}Ejecutando setup de base de datos...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH}/scripts && bash setup-db.sh"

echo -e "${GREEN}Base de datos configurada${NC}"
echo ""

echo -e "${YELLOW}Paso 4: Desplegando aplicación...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && bash scripts/deploy.sh"

echo ""
echo -e "${GREEN}=== Despliegue Completado ===${NC}"
echo ""
echo -e "${YELLOW}La aplicación debería estar corriendo en:${NC}"
echo "  http://${VPS_HOST}:3001"
echo ""
echo -e "${YELLOW}Para verificar el estado:${NC}"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"
echo ""
echo -e "${YELLOW}Para ver los logs:${NC}"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs krono-fichaje'"

