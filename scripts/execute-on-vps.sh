#!/bin/bash

# Script para ejecutar comandos en el VPS
# Uso: ./scripts/execute-on-vps.sh "comando a ejecutar"

set -e

VPS_HOST="54.37.158.9"
VPS_USER="debian"
VPS_PATH="/opt/krono-fichaje"

if [ -z "$1" ]; then
    echo "Uso: $0 \"comando a ejecutar\""
    exit 1
fi

echo "Ejecutando en VPS: $1"
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && $1"

