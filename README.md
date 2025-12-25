# 🕐 Control de Tiempo Laboral - Aplicación Avanzada

Una aplicación moderna de control de tiempo para trabajadores con geolocalización, dashboard en tiempo real, gestión de descansos y reportes avanzados.

## 🚀 Instalación Rápida

### Prerrequisitos
- **Node.js** versión 18 o superior
- **Bun** (recomendado) o **npm**

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd control-de-tiempo-laboral
```

2. **Instalar dependencias**
```bash
# Con Bun (recomendado)
bun install

# O con npm
npm install
```

3. **Ejecutar en desarrollo**
```bash
# Con Bun
bun dev

# O con npm
npm run dev
```

4. **Abrir en el navegador**
   - Ve a: http://localhost:3000
   - La aplicación se recargará automáticamente al hacer cambios

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas principales
│   ├── page.tsx           # Dashboard principal
│   ├── workers/           # Gestión de trabajadores
│   ├── time-tracking/     # Control de tiempo
│   └── reports/           # Reportes y análisis
├── components/            # Componentes React reutilizables
│   ├── navigation.tsx     # Navegación principal
│   ├── dashboard-stats.tsx # Estadísticas del dashboard
│   ├── time-tracker.tsx   # Control de tiempo
│   ├── worker-card.tsx    # Tarjetas de trabajadores
│   └── ...               # Otros componentes
├── lib/                   # Utilidades y almacenamiento
│   ├── storage.ts         # Gestión de datos local
│   └── utils.ts           # Funciones auxiliares
└── types/                 # Definiciones TypeScript
    └── index.ts           # Tipos de la aplicación
```

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
bun dev                    # Inicia servidor de desarrollo
npm run dev               # Inicia servidor de desarrollo

# Producción
bun build                 # Crea build de producción
npm run build            # Crea build de producción

bun start                 # Ejecuta en producción
npm start                # Ejecuta en producción

# Linting
bun lint                  # Verifica código con ESLint
npm run lint             # Verifica código con ESLint
```

## 🎯 Características Principales

### 👥 Gestión de Trabajadores
- ✅ Agregar, editar y eliminar trabajadores
- ✅ Gestión de departamentos y puestos
- ✅ Control de estado activo/inactivo
- ✅ Filtrado y búsqueda avanzada

### ⏰ Control de Tiempo
- ✅ Clock in/out con geolocalización
- ✅ Tracking automático de descansos
- ✅ Cálculo de horas extra
- ✅ Verificación de ubicación para seguridad

### 📊 Dashboard en Tiempo Real
- ✅ Estadísticas live de trabajadores activos
- ✅ Contador de horas trabajadas hoy
- ✅ Vista de actividad reciente
- ✅ Métricas de productividad

### 📈 Reportes Avanzados
- ✅ Filtros por fecha, trabajador, departamento
- ✅ Exportación CSV y JSON
- ✅ Resúmenes por trabajador
- ✅ Cálculo automático de nómina

## 🔧 Configuración

### Variables de Entorno
La aplicación no requiere variables de entorno para funcionar en desarrollo.

### Base de Datos
- La aplicación usa **LocalStorage** para persistir datos
- Los datos se almacenan en el navegador del usuario
- Para producción, se recomienda migrar a una base de datos real

## 🌐 Tecnologías Utilizadas

- **Framework**: Next.js 15 con App Router
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Heroicons
- **Storage**: LocalStorage
- **Geolocation**: Navigator API
- **Package Manager**: Bun (optimizado)

## 📱 Uso de la Aplicación

### 1. Dashboard Principal (`/`)
- Vista general con estadísticas en tiempo real
- Trabajadores activos actualmente
- Horas trabajadas hoy
- Accesos rápidos a funciones principales

### 2. Gestión de Trabajadores (`/workers`)
- Crear nuevos empleados
- Editar información existente
- Activar/desactivar trabajadores
- Ver estadísticas por trabajador

### 3. Control de Tiempo (`/time-tracking`)
- Seleccionar trabajador
- Registrar entrada con geolocalización
- Gestionar descansos
- Registrar salida

### 4. Reportes (`/reports`)
- Filtrar datos por múltiples criterios
- Exportar en diferentes formatos
- Analizar productividad
- Generar reportes de nómina

## 🔒 Seguridad

- **Geolocalización**: Solo se registra la ubicación durante clock in/out
- **Validación**: Todos los formularios tienen validación client-side
- **Datos**: Los datos se almacenan localmente en el navegador

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Otros Platforms
- La aplicación es compatible con cualquier plataforma que soporte Next.js
- Build command: `npm run build`
- Output directory: `.next`

## 🆘 Solución de Problemas

### Error de instalación
```bash
# Limpiar cache
rm -rf node_modules bun.lock
bun install
```

### Puerto en uso
```bash
# Cambiar puerto
PORT=3001 bun dev
```

### Problemas de geolocalización
- Asegúrate de estar en HTTPS o localhost
- Permite permisos de ubicación en el navegador

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación en `CONTEXT.md`
- Verifica los logs de la consola del navegador
- Asegúrate de tener las versiones correctas de Node.js y Bun

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.