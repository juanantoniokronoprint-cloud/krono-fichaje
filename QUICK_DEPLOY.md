# Despliegue Rápido

## Pasos para Desplegar (Ejecutar en orden)

### 1. Subir código al VPS

```bash
# Desde el directorio raíz del proyecto
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env*' -e ssh ./ debian@54.37.158.9:/opt/krono-fichaje/
```

### 2. Conectar al VPS

```bash
ssh debian@54.37.158.9
```

### 3. Configuración inicial (solo primera vez)

```bash
cd /opt/krono-fichaje
chmod +x scripts/*.sh
./scripts/setup-vps.sh
```

### 4. Configurar base de datos

```bash
cd /opt/krono-fichaje/scripts
./setup-db.sh
# GUARDA LA CONTRASEÑA que se genera
```

### 5. Configurar variables de entorno

```bash
cd /opt/krono-fichaje
cp .env.production.example .env.production
nano .env.production
# Editar DB_PASSWORD con la contraseña del paso 4
# Editar PORT según necesidad (ejemplo: 3001)
```

### 6. Desplegar

```bash
cd /opt/krono-fichaje
./scripts/deploy.sh
```

### 7. Configurar firewall

```bash
sudo ufw allow 3001/tcp  # Cambiar 3001 por tu puerto
sudo ufw reload
```

### 8. Verificar

```bash
pm2 status
pm2 logs krono-fichaje
```

Abrir en navegador: http://54.37.158.9:3001 (cambiar puerto según configuración)

---

**Nota**: Si tienes problemas, revisa DEPLOYMENT_INSTRUCTIONS.md para más detalles.
