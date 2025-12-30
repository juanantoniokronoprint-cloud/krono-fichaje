#!/bin/bash

# Script de despliegue para VPS
# Este script despliega la aplicación en el servidor

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Despliegue de Krono Fichaje ===${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json no encontrado. Asegúrate de estar en el directorio del proyecto.${NC}"
    exit 1
fi

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install

# Build de producción
echo -e "${YELLOW}Construyendo aplicación para producción...${NC}"
npm run build

# Verificar que el build fue exitoso
if [ ! -d ".next" ]; then
    echo -e "${RED}Error: El build falló. El directorio .next no existe.${NC}"
    exit 1
fi

echo -e "${GREEN}Build completado exitosamente${NC}"
echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 no está instalado. Instalando...${NC}"
    npm install -g pm2
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Detener aplicación existente si está corriendo
echo -e "${YELLOW}Verificando estado de la aplicación...${NC}"
pm2 delete krono-fichaje 2>/dev/null || true

# Iniciar aplicación con PM2
echo -e "${YELLOW}Iniciando aplicación con PM2...${NC}"
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

echo ""
echo -e "${GREEN}=== Despliegue Completado ===${NC}"
echo ""
echo -e "${YELLOW}Estado de la aplicación:${NC}"
pm2 status

echo ""
echo -e "${YELLOW}Para ver los logs:${NC}"
echo "pm2 logs krono-fichaje"

echo ""
echo -e "${YELLOW}Para reiniciar:${NC}"
echo "pm2 restart krono-fichaje"

echo ""
echo -e "${YELLOW}Para detener:${NC}"
echo "pm2 stop krono-fichaje"

