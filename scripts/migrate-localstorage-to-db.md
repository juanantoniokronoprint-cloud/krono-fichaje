# Guía de Migración: localStorage a Base de Datos

Este documento describe cómo migrar datos desde localStorage a la base de datos MySQL.

## Descripción

Si tienes datos existentes en localStorage y quieres migrarlos a la base de datos, puedes usar este script.

## Pre-requisitos

1. Base de datos configurada y funcionando
2. Variables de entorno configuradas correctamente
3. Aplicación corriendo

## Pasos

### Opción 1: Migración Automática (Recomendado)

1. Abre la aplicación en el navegador
2. Abre la consola del desarrollador (F12)
3. Ejecuta el siguiente código JavaScript:

```javascript
// Script de migración
async function migrateLocalStorageToDB() {
  console.log('Iniciando migración de localStorage a BD...');
  
  // Obtener datos de localStorage
  const workersData = localStorage.getItem('time-tracking-workers');
  const entriesData = localStorage.getItem('time-tracking-entries');
  
  if (!workersData && !entriesData) {
    console.log('No hay datos en localStorage para migrar');
    return;
  }
  
  let workers = [];
  let entries = [];
  
  try {
    if (workersData) {
      workers = JSON.parse(workersData);
      console.log(`Encontrados ${workers.length} trabajadores`);
    }
    
    if (entriesData) {
      entries = JSON.parse(entriesData);
      console.log(`Encontrados ${entries.length} registros de tiempo`);
    }
    
    // Migrar trabajadores
    let workersMigrated = 0;
    for (const worker of workers) {
      try {
        const response = await fetch('/api/workers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(worker),
        });
        
        if (response.ok) {
          workersMigrated++;
          console.log(`✓ Trabajador migrado: ${worker.name}`);
        } else {
          const error = await response.json();
          console.warn(`✗ Error migrando trabajador ${worker.name}:`, error);
        }
      } catch (error) {
        console.error(`Error migrando trabajador ${worker.name}:`, error);
      }
    }
    
    // Migrar registros de tiempo
    let entriesMigrated = 0;
    for (const entry of entries) {
      try {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        
        if (response.ok) {
          entriesMigrated++;
          console.log(`✓ Registro migrado: ${entry.id}`);
        } else {
          const error = await response.json();
          console.warn(`✗ Error migrando registro ${entry.id}:`, error);
        }
      } catch (error) {
        console.error(`Error migrando registro ${entry.id}:`, error);
      }
    }
    
    console.log(`\nMigración completada:`);
    console.log(`- Trabajadores: ${workersMigrated}/${workers.length}`);
    console.log(`- Registros: ${entriesMigrated}/${entries.length}`);
    
    // Opcional: Limpiar localStorage después de migración exitosa
    // localStorage.removeItem('time-tracking-workers');
    // localStorage.removeItem('time-tracking-entries');
    // console.log('LocalStorage limpiado');
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  }
}

// Ejecutar migración
migrateLocalStorageToDB();
```

### Opción 2: Migración Manual mediante API

Puedes crear un script Node.js para migrar los datos:

```javascript
// migrate.js
const fs = require('fs');
const fetch = require('node-fetch'); // npm install node-fetch

async function migrate() {
  // Leer datos de un archivo JSON exportado desde localStorage
  const data = JSON.parse(fs.readFileSync('localstorage-backup.json', 'utf8'));
  
  const API_BASE = 'http://localhost:3000'; // Cambiar según tu configuración
  
  // Migrar trabajadores
  for (const worker of data.workers || []) {
    try {
      const response = await fetch(`${API_BASE}/api/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worker),
      });
      console.log(`Worker ${worker.name}: ${response.ok ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.error(`Error migrando worker ${worker.name}:`, error);
    }
  }
  
  // Migrar registros
  for (const entry of data.timeEntries || []) {
    try {
      const response = await fetch(`${API_BASE}/api/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      console.log(`Entry ${entry.id}: ${response.ok ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.error(`Error migrando entry ${entry.id}:`, error);
    }
  }
}

migrate();
```

## Notas Importantes

1. **Backup**: Siempre haz un backup de tus datos antes de migrar
2. **Duplicados**: El script intentará crear todos los registros. Si ya existen (mismo ID), el API retornará un error
3. **Validación**: Los datos serán validados por el API antes de insertarse
4. **Errores**: Si hay errores, revisa la consola para ver qué datos fallaron
5. **Limpieza**: No elimines localStorage hasta verificar que la migración fue exitosa

## Verificar Migración

Después de migrar, verifica que los datos están en la base de datos:

```sql
-- Conectarse a MySQL
mysql -h 127.0.0.1 -P 3306 -u krono_fichaje_user -p

-- Ver trabajadores
SELECT COUNT(*) FROM workers;

-- Ver registros
SELECT COUNT(*) FROM time_entries;

-- Ver algunos registros
SELECT * FROM workers LIMIT 5;
SELECT * FROM time_entries LIMIT 5;
```

## Exportar desde localStorage

Si quieres exportar datos desde localStorage antes de migrar:

```javascript
// En la consola del navegador
const data = {
  workers: JSON.parse(localStorage.getItem('time-tracking-workers') || '[]'),
  timeEntries: JSON.parse(localStorage.getItem('time-tracking-entries') || '[]'),
};

const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'localstorage-backup.json';
a.click();
```

