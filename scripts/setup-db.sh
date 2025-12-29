#!/bin/bash

# Script para configurar la base de datos krono_fichaje en VPS
# MySQL está corriendo en contenedor Docker: krono_mysql

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DB_CONTAINER="krono_mysql"
DB_ROOT_USER="root"
DB_ROOT_PASSWORD="root_password"
DB_NAME="krono_fichaje"
DB_USER="krono_fichaje_user"
DB_PASSWORD=""

# Generar contraseña segura si no se proporciona
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
fi

echo -e "${GREEN}=== Configuración de Base de Datos Krono Fichaje ===${NC}"
echo ""

# Verificar que el contenedor Docker está corriendo
echo -e "${YELLOW}Verificando contenedor Docker...${NC}"
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: El contenedor $DB_CONTAINER no está corriendo${NC}"
    exit 1
fi
echo -e "${GREEN}Contenedor $DB_CONTAINER encontrado${NC}"
echo ""

# Crear base de datos y usuario
echo -e "${YELLOW}Creando base de datos y usuario...${NC}"
docker exec -i "$DB_CONTAINER" mysql -u "$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Base de datos y usuario creados exitosamente${NC}"
else
    echo -e "${RED}Error al crear base de datos o usuario${NC}"
    exit 1
fi
echo ""

# Ejecutar schema.sql
echo -e "${YELLOW}Ejecutando schema.sql...${NC}"
if [ -f "schema.sql" ]; then
    docker exec -i "$DB_CONTAINER" mysql -u "$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" < schema.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Schema ejecutado exitosamente${NC}"
    else
        echo -e "${RED}Error al ejecutar schema.sql${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Advertencia: schema.sql no encontrado en el directorio actual${NC}"
    echo "Asegúrate de ejecutar este script desde el directorio scripts/"
fi
echo ""

# Mostrar información de conexión
echo -e "${GREEN}=== Configuración Completada ===${NC}"
echo ""
echo -e "${YELLOW}Información de conexión:${NC}"
echo "Base de datos: $DB_NAME"
echo "Usuario: $DB_USER"
echo "Contraseña: $DB_PASSWORD"
echo "Host: 127.0.0.1 (desde el host) o mysql (desde Docker)"
echo "Puerto: 3306"
echo ""
echo -e "${YELLOW}Variables de entorno para .env.production:${NC}"
echo "DB_HOST=127.0.0.1"
echo "DB_PORT=3306"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_NAME=$DB_NAME"
echo ""
echo -e "${GREEN}Guarda la contraseña de forma segura!${NC}"

