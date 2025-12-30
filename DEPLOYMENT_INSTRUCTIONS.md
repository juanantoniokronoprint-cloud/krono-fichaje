# Instrucciones de Despliegue en VPS

## Paso a Paso para Desplegar en el VPS

### Paso 1: Preparar el Código Localmente

1. Asegúrate de tener todos los cambios commitados (opcional, pero recomendado)
2. Verifica que todas las dependencias estén listadas en `package.json`

### Paso 2: Subir Código al VPS

**Opción A: Usar rsync (Recomendado)**

```bash
# Desde el directorio raíz del proyecto
rsync -avz --exclude 'node_modules' \
           --exclude '.next' \
           --exclude '.git' \
           --exclude '.env.local' \
           --exclude '.env.production' \
           -e ssh \
           ./ debian@54.37.158.9:/opt/krono-fichaje/
```

**Opción B: Usar el script automatizado**

```bash
./scripts/deploy-to-vps.sh
```

**Opción C: Usar git (si tienes un repositorio)**

```bash
ssh debian@54.37.158.9
cd /opt/krono-fichaje
git pull origin main  # o la rama que uses
```

### Paso 3: Conectar al VPS

```bash
ssh debian@54.37.158.9
```

### Paso 4: Configurar el Entorno Inicial (Solo primera vez)

```bash
cd /opt/krono-fichaje
chmod +x scripts/*.sh
./scripts/setup-vps.sh
```

Este script instalará Node.js y PM2 si no están instalados.

### Paso 5: Configurar Base de Datos

1. **Ejecutar script de setup de BD:**

```bash
cd /opt/krono-fichaje/scripts
./setup-db.sh
```

**Importante**: Este script generará una contraseña aleatoria para el usuario de la BD. **Guárdala** porque la necesitarás en el siguiente paso.

2. **Si el script falla, puedes hacerlo manualmente:**

```bash
# Conectarse al contenedor MySQL
docker exec -i krono_mysql mysql -u root -proot_password < scripts/schema.sql

# O crear manualmente la BD y usuario
docker exec -it krono_mysql mysql -u root -proot_password

# Dentro de MySQL:
CREATE DATABASE IF NOT EXISTS krono_fichaje CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'krono_fichaje_user'@'%' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA_AQUI';
GRANT ALL PRIVILEGES ON krono_fichaje.* TO 'krono_fichaje_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 6: Configurar Variables de Entorno

```bash
cd /opt/krono-fichaje
cp .env.production.example .env.production
nano .env.production  # o usa vi/vim
```

Edita el archivo con estos valores:

```env
# Base de Datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=krono_fichaje_user
DB_PASSWORD=<la_contraseña_generada_en_paso_5>
DB_NAME=krono_fichaje

# Servidor (cambiar el puerto según necesidad, por ejemplo: 3001, 4000, 5000)
PORT=3001
NODE_ENV=production
HOSTNAME=0.0.0.0
```

Guarda el archivo (Ctrl+X, luego Y, luego Enter en nano).

### Paso 7: Probar Conexión a Base de Datos (Opcional)

```bash
# Probar conexión
docker exec -it krono_mysql mysql -u krono_fichaje_user -p krono_fichaje
# Introducir la contraseña cuando se solicite
# Si conecta correctamente, escribe EXIT; para salir
```

### Paso 8: Desplegar la Aplicación

```bash
cd /opt/krono-fichaje
./scripts/deploy.sh
```

Este script:
- Instalará las dependencias de producción
- Construirá la aplicación
- Iniciará la aplicación con PM2

### Paso 9: Configurar Firewall (Si es necesario)

```bash
# Permitir el puerto (ejemplo para puerto 3001)
sudo ufw allow 3001/tcp
sudo ufw reload
```

### Paso 10: Verificar el Despliegue

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs krono-fichaje

# Ver información detallada
pm2 describe krono-fichaje
```

### Paso 11: Configurar Inicio Automático

```bash
pm2 save
pm2 startup
# Ejecutar el comando que PM2 sugiere (generalmente con sudo)
```

### Paso 12: Probar la Aplicación

Abre en tu navegador:
```
http://54.37.158.9:3001
```

(Sustituye 3001 por el puerto que configuraste en `.env.production`)

## Comandos Útiles Post-Despliegue

### Ver logs en tiempo real
```bash
pm2 logs krono-fichaje
```

### Reiniciar aplicación
```bash
pm2 restart krono-fichaje
```

### Detener aplicación
```bash
pm2 stop krono-fichaje
```

### Ver uso de recursos
```bash
pm2 monit
```

### Verificar conexión a BD
```bash
cd /opt/krono-fichaje
node -e "require('dotenv').config({path: '.env.production'}); const mysql = require('mysql2/promise'); (async () => { try { const conn = await mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}); console.log('✓ Conexión exitosa'); await conn.end(); } catch(e) { console.error('✗ Error:', e.message); process.exit(1); } })();"
```

## Actualizar la Aplicación

Para actualizar después de hacer cambios:

1. **Subir código** (usando rsync o git pull)
2. **En el VPS:**
   ```bash
   cd /opt/krono-fichaje
   ./scripts/deploy.sh
   ```

## Solución de Problemas

### Error: "Cannot connect to database"

1. Verifica que MySQL está corriendo:
   ```bash
   docker ps | grep krono_mysql
   ```

2. Verifica las credenciales en `.env.production`

3. Prueba la conexión manualmente (ver Paso 7)

### Error: "Port already in use"

Cambia el puerto en `.env.production` y reinicia:
```bash
pm2 restart krono-fichaje
```

### Error: "PM2 command not found"

Instala PM2:
```bash
npm install -g pm2
```

### Ver logs de errores

```bash
pm2 logs krono-fichaje --err
```

### Resetear completamente

Si necesitas empezar de cero:

```bash
# En el VPS
cd /opt/krono-fichaje
pm2 delete krono-fichaje
rm -rf node_modules .next
npm install --production
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## Backup de Base de Datos

Para hacer backup:

```bash
# Backup
docker exec krono_mysql mysqldump -u root -proot_password krono_fichaje > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar
docker exec -i krono_mysql mysql -u root -proot_password krono_fichaje < backup_YYYYMMDD_HHMMSS.sql
```

