# Guía de Despliegue - Krono Fichaje

Esta guía te ayudará a desplegar la aplicación Krono Fichaje en el VPS.

## Información del VPS

- **IP**: 54.37.158.9
- **Usuario**: debian
- **Contraseña**: Kronito2025.
- **Directorio sugerido**: `/opt/krono-fichaje` o `/home/debian/krono-fichaje`
- **Base de Datos**: MySQL 8.0 en contenedor Docker (`krono_mysql`)
  - Puerto: `3306:3306`
  - Conexión desde host: `127.0.0.1:3306`
  - Usuario root: `root` / `root_password`

## Prerrequisitos

1. Acceso SSH al VPS
2. MySQL corriendo en Docker (contenedor `krono_mysql`)
3. Node.js 20.x o superior
4. PM2 instalado globalmente

## Paso 1: Conectar al VPS

```bash
ssh debian@54.37.158.9
```

## Paso 2: Configuración Inicial (Solo primera vez)

Ejecutar el script de configuración inicial:

```bash
cd /opt/krono-fichaje  # o donde hayas subido el código
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh
```

Este script instalará Node.js y PM2 si no están instalados.

## Paso 3: Configurar Base de Datos

### 3.1. Ejecutar Script de Setup de BD

```bash
cd scripts
chmod +x setup-db.sh
./setup-db.sh
```

Este script:
- Crea la base de datos `krono_fichaje`
- Crea el usuario `krono_fichaje_user`
- Ejecuta el schema SQL

**Nota**: El script generará una contraseña aleatoria. Guárdala para el siguiente paso.

### 3.2. Ejecutar Schema SQL (Alternativa manual)

Si prefieres hacerlo manualmente:

```bash
# Opción 1: Usando docker exec
docker exec -i krono_mysql mysql -u root -proot_password < scripts/schema.sql

# Opción 2: Conectándose desde el host
mysql -h 127.0.0.1 -P 3306 -u root -proot_password < scripts/schema.sql
```

## Paso 4: Configurar Variables de Entorno

Crear archivo `.env.production` en la raíz del proyecto:

```bash
cp .env.production.example .env.production
nano .env.production
```

Editar con los siguientes valores:

```env
# Base de Datos (MySQL en contenedor Docker)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=krono_fichaje_user
DB_PASSWORD=<password_generada_en_paso_3>
DB_NAME=krono_fichaje

# Servidor (puerto personalizado - cambiar según necesidad)
PORT=3001
NODE_ENV=production
HOSTNAME=0.0.0.0
```

**Importante**: Reemplaza `<password_generada_en_paso_3>` con la contraseña generada por el script setup-db.sh.

## Paso 5: Desplegar Aplicación

Ejecutar el script de despliegue:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Este script:
1. Instala dependencias de producción
2. Construye la aplicación
3. Inicia la aplicación con PM2
4. Configura PM2 para inicio automático

## Paso 6: Configurar Firewall

Abrir el puerto en el firewall (ejemplo para puerto 3001):

```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

## Paso 7: Verificar Despliegue

### Verificar estado de la aplicación:

```bash
pm2 status
```

### Ver logs:

```bash
pm2 logs krono-fichaje
```

### Probar la aplicación:

```bash
curl http://localhost:3001
```

O abrir en el navegador: `http://54.37.158.9:3001`

## Gestión de la Aplicación con PM2

### Ver estado:
```bash
pm2 status
```

### Ver logs en tiempo real:
```bash
pm2 logs krono-fichaje
```

### Ver logs de error:
```bash
pm2 logs krono-fichaje --err
```

### Reiniciar aplicación:
```bash
pm2 restart krono-fichaje
```

### Detener aplicación:
```bash
pm2 stop krono-fichaje
```

### Iniciar aplicación:
```bash
pm2 start krono-fichaje
```

### Eliminar de PM2:
```bash
pm2 delete krono-fichaje
```

### Configurar inicio automático del sistema:
```bash
pm2 startup
pm2 save
```

## Actualización de la Aplicación

Para actualizar la aplicación después de cambios:

1. **Subir código actualizado al VPS** (git pull, scp, etc.)

2. **Ejecutar script de despliegue**:
```bash
./scripts/deploy.sh
```

O manualmente:

```bash
npm install --production
npm run build
pm2 restart krono-fichaje
```

## Backup de Base de Datos

Para hacer backup de la base de datos:

```bash
# Backup desde contenedor Docker
docker exec krono_mysql mysqldump -u root -proot_password krono_fichaje > backup_$(date +%Y%m%d_%H%M%S).sql

# O desde el host
mysqldump -h 127.0.0.1 -P 3306 -u root -proot_password krono_fichaje > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restaurar Backup

```bash
# Restaurar desde contenedor Docker
docker exec -i krono_mysql mysql -u root -proot_password krono_fichaje < backup_YYYYMMDD_HHMMSS.sql

# O desde el host
mysql -h 127.0.0.1 -P 3306 -u root -proot_password krono_fichaje < backup_YYYYMMDD_HHMMSS.sql
```

## Solución de Problemas

### Error: "Cannot connect to database"

1. Verificar que MySQL está corriendo:
```bash
docker ps | grep krono_mysql
```

2. Verificar credenciales en `.env.production`

3. Probar conexión manual:
```bash
mysql -h 127.0.0.1 -P 3306 -u krono_fichaje_user -p
```

### Error: "Port already in use"

Cambiar el puerto en `.env.production` y reiniciar:
```bash
pm2 restart krono-fichaje
```

### Error: "PM2 command not found"

Instalar PM2:
```bash
sudo npm install -g pm2
```

### Ver logs detallados:

```bash
# Logs de PM2
pm2 logs krono-fichaje --lines 100

# Logs de Next.js (si hay errores de build)
cat logs/pm2-error.log
```

## Estructura de Directorios en VPS

```
/opt/krono-fichaje/
├── .env.production          # Variables de entorno de producción
├── .next/                   # Build de Next.js
├── node_modules/            # Dependencias
├── logs/                    # Logs de PM2
│   ├── pm2-error.log
│   ├── pm2-out.log
│   └── pm2-combined.log
├── scripts/
│   ├── schema.sql
│   ├── setup-db.sh
│   ├── setup-vps.sh
│   └── deploy.sh
├── ecosystem.config.js      # Configuración PM2
├── server.js                # Servidor personalizado
└── package.json
```

## Monitoreo

### Ver uso de recursos:

```bash
pm2 monit
```

### Ver información detallada:

```bash
pm2 describe krono-fichaje
```

## Seguridad

- **Cambiar contraseñas**: Asegúrate de cambiar las contraseñas por defecto
- **Firewall**: Solo abrir el puerto necesario en el firewall
- **HTTPS**: Considera usar un proxy inverso (nginx) con SSL para producción
- **Variables de entorno**: Nunca commitear `.env.production` al repositorio

## Soporte

Para problemas o preguntas, revisa:
- Logs de PM2: `pm2 logs krono-fichaje`
- Logs del sistema: `journalctl -u pm2-krono-fichaje`
- Estado de la aplicación: `pm2 status`

