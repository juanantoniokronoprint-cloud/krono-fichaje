# Error Handling Documentation

Este documento describe el sistema de manejo de errores implementado en la aplicación de control de tiempo laboral.

## Tipos de Errores

El sistema categoriza los errores en los siguientes tipos:

- **VALIDATION**: Errores de validación de datos de entrada
- **STORAGE**: Errores relacionados con localStorage y persistencia de datos
- **NETWORK**: Errores de conexión y comunicación con servicios externos
- **BUSINESS_LOGIC**: Errores de lógica de negocio (ej: doble clock-in)
- **PERMISSION**: Errores de permisos de usuario
- **UNKNOWN**: Errores no categorizados

## Niveles de Severidad

- **LOW**: Información, no crítico
- **MEDIUM**: Advertencia, requiere atención
- **HIGH**: Error importante, puede afectar funcionalidad
- **CRITICAL**: Error crítico, requiere acción inmediata

## Manejo de Errores por Operación

### Clock In/Out

**Errores posibles:**
- Geolocalización no disponible (`NETWORK`, `MEDIUM`)
- Trabajador ya tiene entrada activa (`BUSINESS_LOGIC`, `MEDIUM`)
- Trabajador inactivo (`BUSINESS_LOGIC`, `MEDIUM`)
- Error al guardar entrada (`STORAGE`, `HIGH`)

**Mensajes al usuario:**
- "Error al obtener la ubicación. Verifica tu conexión e intenta nuevamente."
- "Este trabajador ya tiene una entrada activa. Por favor, registra la salida primero."
- "Este trabajador está inactivo. Contacta al administrador."
- "Error al guardar los datos. Por favor, intenta nuevamente."

### Gestión de Trabajadores

**Errores posibles:**
- Datos de validación inválidos (`VALIDATION`, `MEDIUM`)
- Email duplicado (`VALIDATION`, `MEDIUM`)
- Error al guardar (`STORAGE`, `HIGH`)
- Datos corruptos (`STORAGE`, `HIGH`)

**Mensajes al usuario:**
- "Los datos ingresados no son válidos. Por favor, verifica la información."
- "Ya existe un trabajador con este correo electrónico."
- "Error al guardar los trabajadores. Por favor, intenta nuevamente."
- "Los datos están corruptos. Se intentará restaurar desde backup."

### Almacenamiento

**Errores posibles:**
- localStorage lleno (`STORAGE`, `HIGH`)
- Datos corruptos (`STORAGE`, `HIGH`)
- localStorage no disponible (`STORAGE`, `CRITICAL`)
- Error de parseo JSON (`STORAGE`, `HIGH`)

**Mensajes al usuario:**
- "El almacenamiento está lleno. Por favor, contacta al administrador."
- "Error al leer los datos. Los datos pueden estar corruptos."
- "El almacenamiento local no está disponible."
- "Error al procesar los datos. Los datos pueden estar corruptos."

### Recuperación de Datos

**Errores posibles:**
- Backup no disponible (`STORAGE`, `MEDIUM`)
- Datos corruptos en backup (`STORAGE`, `HIGH`)
- Error al restaurar (`STORAGE`, `HIGH`)

**Mensajes al usuario:**
- "No se encontró backup para restaurar."
- "El backup también está corrupto. Se usarán datos por defecto."
- "Error al restaurar los datos. Contacta al administrador."

## Flujo de Manejo de Errores

1. **Detección**: El error se detecta en el código
2. **Categorización**: Se categoriza según tipo y severidad
3. **Registro**: Se registra en el sistema de logging
4. **Mensaje al usuario**: Se muestra mensaje user-friendly en español
5. **Recuperación**: Se intenta recuperación automática si es posible
6. **Auditoría**: Errores críticos se guardan en localStorage para auditoría

## Ejemplos de Uso

### Manejo de Error Simple

```typescript
try {
  const entry = TimeEntryStorage.create(newEntry);
} catch (error) {
  const appError = ErrorHandler.handleError(
    error,
    ErrorType.STORAGE,
    ErrorSeverity.HIGH,
    { operation: 'createEntry' }
  );
  notifications.showError(appError.userMessage);
}
```

### Error Personalizado

```typescript
if (hasActiveEntry) {
  throw new BusinessLogicError(
    'Worker already has an active entry',
    'Este trabajador ya tiene una entrada activa.',
    'DUPLICATE_CLOCK_IN'
  );
}
```

## Logs de Errores

Los errores de severidad HIGH y CRITICAL se almacenan en localStorage con:
- Timestamp
- Tipo y severidad
- Mensaje técnico y user-friendly
- Contexto adicional
- Stack trace (si disponible)

Los logs se pueden acceder mediante `ErrorHandler.getErrorLogs()` y están limitados a los últimos 100 errores.

