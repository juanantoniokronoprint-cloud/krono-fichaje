#!/bin/bash

# Script de despliegue directo usando sshpass o expect

set -e

VPS_HOST="54.37.158.9"
VPS_USER="debian"
VPS_PASS="Kronito2025."
VPS_PATH="/opt/krono-fichaje"

# Función para ejecutar comandos remotos
execute_remote() {
    local cmd="$1"
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${VPS_USER}@${VPS_HOST} "$cmd"
    elif command -v expect &> /dev/null; then
        expect -c "
        set timeout 30
        spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${VPS_USER}@${VPS_HOST} \"$cmd\"
        expect {
            \"password:\" { send \"${VPS_PASS}\r\"; exp_continue }
            \"Password:\" { send \"${VPS_PASS}\r\"; exp_continue }
            eof
        }
        "
    else
        echo "Error: Necesitas sshpass o expect instalado"
        exit 1
    fi
}

# Función para copiar archivos
copy_files() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env.local' --exclude '.env.production' -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
    else
        echo "Usando rsync normal (se pedirá contraseña)..."
        rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env.local' --exclude '.env.production' -e ssh ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
    fi
}

echo "=== Paso 1: Sincronizando archivos ==="
copy_files

echo ""
echo "=== Paso 2: Configuración inicial ==="
execute_remote "mkdir -p ${VPS_PATH} && cd ${VPS_PATH} && chmod +x scripts/*.sh 2>/dev/null || true"

echo ""
echo "=== Paso 3: Setup inicial del VPS ==="
execute_remote "cd ${VPS_PATH} && bash scripts/setup-vps.sh"

echo ""
echo "=== Paso 4: Configurando base de datos ==="
execute_remote "cd ${VPS_PATH}/scripts && bash setup-db.sh"

echo ""
echo "=== Paso 5: Desplegando aplicación ==="
execute_remote "cd ${VPS_PATH} && bash scripts/deploy.sh"

echo ""
echo "=== Despliegue completado ==="
echo "Verifica con: ssh ${VPS_USER}@${VPS_HOST} 'pm2 status'"

