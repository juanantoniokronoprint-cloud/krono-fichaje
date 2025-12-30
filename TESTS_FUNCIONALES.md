# Batería de Tests Funcionales - Krono Fichaje

## 📋 Índice de Tests

### 1. Tests de Autenticación
### 2. Tests de Gestión de Trabajadores
### 3. Tests de Fichaje (Entrada/Salida/Descansos)
### 4. Tests de Reportes
### 5. Tests de Configuración
### 6. Tests de Seguridad y Acceso
### 7. Tests de Integración

---

## 1. Tests de Autenticación

### Test 1.1: Login con PIN de Administrador
**Objetivo**: Verificar que el PIN de administrador permite acceso completo

**Pasos**:
1. Acceder a la aplicación
2. Introducir PIN de administrador (por defecto: 123456)
3. Verificar que se accede al dashboard de administrador
4. Verificar que se muestran todos los menús (Trabajadores, Reportes, Control de Tiempo, Configuración)

**Resultado Esperado**: ✅ Acceso completo como administrador

**Estado**: ⬜ Pendiente

---

### Test 1.2: Login con PIN de Trabajador
**Objetivo**: Verificar que los trabajadores pueden acceder con su PIN

**Pasos**:
1. Crear un trabajador con PIN "1234"
2. Cerrar sesión de administrador
3. Introducir PIN "1234"
4. Verificar que accede a su panel personal
5. Verificar que NO puede ver otros trabajadores
6. Verificar que solo ve "Control de Tiempo" en el menú

**Resultado Esperado**: ✅ Acceso restringido para trabajador

**Estado**: ⬜ Pendiente

---

### Test 1.3: PIN Incorrecto
**Objetivo**: Verificar que PINs incorrectos son rechazados

**Pasos**:
1. Intentar acceder con PIN "99999" (inexistente)
2. Verificar que se muestra mensaje de error
3. Verificar que NO se permite el acceso

**Resultado Esperado**: ✅ Rechazo de PIN incorrecto con mensaje claro

**Estado**: ⬜ Pendiente

---

### Test 1.4: Sesión Persistente
**Objetivo**: Verificar que la sesión se mantiene después de recargar

**Pasos**:
1. Iniciar sesión como administrador
2. Recargar la página (F5)
3. Verificar que sigue autenticado
4. Cerrar navegador y volver a abrir
5. Verificar que la sesión persiste (8 horas)

**Resultado Esperado**: ✅ Sesión válida durante 8 horas

**Estado**: ⬜ Pendiente

---

### Test 1.5: Cerrar Sesión
**Objetivo**: Verificar que el logout funciona correctamente

**Pasos**:
1. Iniciar sesión
2. Hacer clic en "Cerrar Sesión"
3. Verificar que vuelve a la pantalla de login
4. Verificar que no se puede acceder sin PIN

**Resultado Esperado**: ✅ Logout completo y efectivo

**Estado**: ⬜ Pendiente

---

## 2. Tests de Gestión de Trabajadores

### Test 2.1: Crear Trabajador
**Objetivo**: Verificar que se puede crear un nuevo trabajador

**Pasos**:
1. Iniciar sesión como administrador
2. Ir a "Trabajadores"
3. Hacer clic en "Nuevo Trabajador"
4. Rellenar formulario:
   - Nombre: "Test Usuario"
   - Email: "test@test.com"
   - Puesto: "Tester"
   - Departamento: "QA"
   - Fecha contratación: Hoy
   - Salario: 15.00
   - PIN: "9876"
5. Guardar
6. Verificar que aparece en la lista

**Resultado Esperado**: ✅ Trabajador creado correctamente

**Estado**: ⬜ Pendiente

---

### Test 2.2: Editar Trabajador
**Objetivo**: Verificar que se puede editar un trabajador existente

**Pasos**:
1. Seleccionar un trabajador existente
2. Hacer clic en "Editar"
3. Cambiar el nombre
4. Cambiar el PIN
5. Guardar
6. Verificar que los cambios se aplicaron

**Resultado Esperado**: ✅ Cambios guardados correctamente

**Estado**: ⬜ Pendiente

---

### Test 2.3: Validación de Campos Obligatorios
**Objetivo**: Verificar validación del formulario

**Pasos**:
1. Intentar crear trabajador sin nombre
2. Verificar mensaje de error
3. Intentar crear trabajador con email inválido
4. Verificar mensaje de error
5. Intentar crear trabajador con PIN menor a 4 caracteres
6. Verificar mensaje de error

**Resultado Esperado**: ✅ Validaciones funcionan correctamente

**Estado**: ⬜ Pendiente

---

### Test 2.4: Eliminar Trabajador
**Objetivo**: Verificar que se puede eliminar un trabajador

**Pasos**:
1. Crear trabajador de prueba
2. Eliminarlo
3. Verificar que desaparece de la lista
4. Verificar que sus registros de tiempo también se eliminan (cascade)

**Resultado Esperado**: ✅ Eliminación correcta con cascade

**Estado**: ⬜ Pendiente

---

### Test 2.5: Trabajador Inactivo
**Objetivo**: Verificar que trabajadores inactivos no pueden fichar

**Pasos**:
1. Marcar un trabajador como inactivo
2. Intentar fichar con su PIN
3. Verificar que se muestra mensaje de error

**Resultado Esperado**: ✅ Trabajadores inactivos no pueden fichar

**Estado**: ⬜ Pendiente

---

## 3. Tests de Fichaje

### Test 3.1: Fichaje de Entrada
**Objetivo**: Verificar que el fichaje de entrada funciona

**Pasos**:
1. Acceder con PIN de trabajador
2. Verificar que aparece "Registrar Entrada"
3. Hacer clic en "Registrar Entrada"
4. Verificar mensaje de éxito
5. Verificar que aparece el tiempo transcurrido
6. Verificar que aparece "Registrar Salida"

**Resultado Esperado**: ✅ Entrada registrada correctamente

**Estado**: ⬜ Pendiente

---

### Test 3.2: Fichaje de Salida
**Objetivo**: Verificar que el fichaje de salida funciona

**Pasos**:
1. Tener una entrada activa
2. Hacer clic en "Registrar Salida"
3. Confirmar en el diálogo
4. Verificar mensaje de éxito con horas trabajadas
5. Verificar que vuelve a aparecer "Registrar Entrada"

**Resultado Esperado**: ✅ Salida registrada con cálculo de horas

**Estado**: ⬜ Pendiente

---

### Test 3.3: Gestión de Descansos
**Objetivo**: Verificar inicio y fin de descansos

**Pasos**:
1. Fichar entrada
2. Hacer clic en "Iniciar Descanso"
3. Verificar que aparece "En pausa"
4. Esperar 1 minuto
5. Hacer clic en "Finalizar Descanso"
6. Verificar que vuelve a "Trabajando"
7. Fichar salida
8. Verificar que las horas de descanso se descuentan

**Resultado Esperado**: ✅ Descansos gestionados correctamente

**Estado**: ⬜ Pendiente

---

### Test 3.4: Doble Entrada Prevenida
**Objetivo**: Verificar que no se puede fichar dos veces sin salir

**Pasos**:
1. Fichar entrada
2. Intentar fichar entrada de nuevo (recargar página y volver a intentar)
3. Verificar que se muestra mensaje de error
4. Verificar que no se crea segunda entrada

**Resultado Esperado**: ✅ Prevención de doble entrada

**Estado**: ⬜ Pendiente

---

### Test 3.5: Cálculo de Horas
**Objetivo**: Verificar cálculo correcto de horas trabajadas

**Pasos**:
1. Fichar entrada a las 9:00
2. Iniciar descanso a las 13:00
3. Finalizar descanso a las 14:00 (1 hora de descanso)
4. Fichar salida a las 18:00
5. Verificar:
   - Total horas: 8 horas
   - Horas netas (descontando descanso): 7 horas
   - Horas extra: 0 (dentro de las 8 horas)

**Resultado Esperado**: ✅ Cálculo preciso de horas

**Estado**: ⬜ Pendiente

---

### Test 3.6: Cálculo de Horas Extra
**Objetivo**: Verificar cálculo de horas extra

**Pasos**:
1. Fichar entrada
2. Trabajar más de 8 horas (simular o esperar)
3. Fichar salida
4. Verificar que se calculan horas extra correctamente

**Resultado Esperado**: ✅ Horas extra calculadas cuando se superan 8h

**Estado**: ⬜ Pendiente

---

## 4. Tests de Reportes

### Test 4.1: Carga de Reportes
**Objetivo**: Verificar que los reportes cargan datos

**Pasos**:
1. Crear varios fichajes (entradas/salidas)
2. Ir a "Reportes"
3. Verificar que se cargan los datos
4. Verificar que aparecen en la tabla

**Resultado Esperado**: ✅ Reportes muestran datos correctamente

**Estado**: ⬜ Pendiente

---

### Test 4.2: Filtros por Fecha
**Objetivo**: Verificar filtrado por rango de fechas

**Pasos**:
1. Crear fichajes en diferentes fechas (hoy, ayer, hace una semana)
2. Ir a Reportes
3. Filtrar por "Hoy"
4. Verificar que solo aparecen fichajes de hoy
5. Cambiar a "Esta semana"
6. Verificar que aparecen todos los de la semana

**Resultado Esperado**: ✅ Filtros de fecha funcionan correctamente

**Estado**: ⬜ Pendiente

---

### Test 4.3: Filtros por Trabajador
**Objetivo**: Verificar filtrado por trabajador

**Pasos**:
1. Crear fichajes de varios trabajadores
2. Filtrar por un trabajador específico
3. Verificar que solo aparecen sus fichajes

**Resultado Esperado**: ✅ Filtro por trabajador funciona

**Estado**: ⬜ Pendiente

---

### Test 4.4: Filtros por Departamento
**Objetivo**: Verificar filtrado por departamento

**Pasos**:
1. Crear trabajadores en diferentes departamentos
2. Filtrar por departamento
3. Verificar que solo aparecen trabajadores de ese departamento

**Resultado Esperado**: ✅ Filtro por departamento funciona

**Estado**: ⬜ Pendiente

---

### Test 4.5: Exportación CSV
**Objetivo**: Verificar exportación a CSV

**Pasos**:
1. Ir a Reportes
2. Aplicar filtros
3. Hacer clic en "Exportar CSV"
4. Verificar que se descarga el archivo
5. Abrir el CSV y verificar contenido

**Resultado Esperado**: ✅ CSV exportado correctamente

**Estado**: ⬜ Pendiente

---

### Test 4.6: Exportación JSON
**Objetivo**: Verificar exportación a JSON

**Pasos**:
1. Ir a Reportes
2. Hacer clic en "Exportar JSON"
3. Verificar que se descarga el archivo
4. Abrir el JSON y verificar estructura

**Resultado Esperado**: ✅ JSON exportado correctamente

**Estado**: ⬜ Pendiente

---

### Test 4.7: Estadísticas del Dashboard
**Objetivo**: Verificar cálculos de estadísticas

**Pasos**:
1. Crear varios fichajes
2. Ir al Dashboard principal
3. Verificar:
   - Total de trabajadores
   - Trabajadores activos
   - Horas trabajadas hoy
   - Horas extra hoy
4. Comparar con datos reales

**Resultado Esperado**: ✅ Estadísticas correctas

**Estado**: ⬜ Pendiente

---

## 5. Tests de Configuración

### Test 5.1: Cambiar PIN de Administrador
**Objetivo**: Verificar cambio de PIN admin

**Pasos**:
1. Ir a "Configuración"
2. Verificar PIN actual
3. Cambiar PIN a "999999"
4. Guardar
5. Cerrar sesión
6. Intentar acceder con PIN antiguo (debe fallar)
7. Acceder con PIN nuevo (debe funcionar)

**Resultado Esperado**: ✅ PIN cambiado correctamente

**Estado**: ⬜ Pendiente

---

### Test 5.2: Validación de PIN
**Objetivo**: Verificar validación de PIN en configuración

**Pasos**:
1. Intentar cambiar PIN a menos de 4 caracteres
2. Verificar mensaje de error
3. Intentar cambiar PIN con campos no coincidentes
4. Verificar mensaje de error

**Resultado Esperado**: ✅ Validaciones funcionan

**Estado**: ⬜ Pendiente

---

## 6. Tests de Seguridad y Acceso

### Test 6.1: Acceso Restringido para Trabajadores
**Objetivo**: Verificar que trabajadores no ven funciones de admin

**Pasos**:
1. Acceder con PIN de trabajador
2. Verificar que NO aparece menú "Trabajadores"
3. Verificar que NO aparece menú "Reportes"
4. Verificar que NO aparece menú "Configuración"
5. Intentar acceder directamente a /workers (debe redirigir)
6. Intentar acceder directamente a /reports (debe redirigir)

**Resultado Esperado**: ✅ Acceso correctamente restringido

**Estado**: ⬜ Pendiente

---

### Test 6.2: Trabajador Solo Ve Su Información
**Objetivo**: Verificar privacidad de datos

**Pasos**:
1. Crear dos trabajadores con fichajes
2. Acceder con PIN del trabajador 1
3. Verificar que solo ve su propio tiempo trabajado
4. Verificar que NO ve información de otros trabajadores

**Resultado Esperado**: ✅ Privacidad mantenida

**Estado**: ⬜ Pendiente

---

### Test 6.3: Acceso sin Autenticación
**Objetivo**: Verificar que páginas protegidas requieren autenticación

**Pasos**:
1. Cerrar sesión
2. Intentar acceder directamente a /workers
3. Verificar que redirige a login
4. Intentar acceder directamente a /reports
5. Verificar que redirige a login

**Resultado Esperado**: ✅ Protección de rutas funciona

**Estado**: ⬜ Pendiente

---

## 7. Tests de Integración

### Test 7.1: Flujo Completo - Día de Trabajo
**Objetivo**: Verificar flujo completo de un día laboral

**Pasos**:
1. Crear trabajador "Juan Test"
2. Acceder con su PIN
3. Fichar entrada (9:00)
4. Trabajar 4 horas (simulado)
5. Iniciar descanso (13:00)
6. Finalizar descanso (14:00)
7. Trabajar 4 horas más
8. Fichar salida (18:00)
9. Verificar:
   - Total horas: 8h
   - Descanso: 1h
   - Netas: 7h
10. Como admin, ir a Reportes
11. Filtrar por hoy y por este trabajador
12. Verificar que el registro aparece completo

**Resultado Esperado**: ✅ Flujo completo funciona end-to-end

**Estado**: ⬜ Pendiente

---

### Test 7.2: Múltiples Trabajadores Simultáneos
**Objetivo**: Verificar comportamiento con múltiples trabajadores

**Pasos**:
1. Crear 3 trabajadores
2. Fichar entrada para los 3
3. Verificar que todos aparecen como "Trabajando" en el dashboard
4. Fichar salida para uno
5. Verificar que desaparece de activos
6. Los otros dos siguen activos

**Resultado Esperado**: ✅ Sistema maneja múltiples usuarios

**Estado**: ⬜ Pendiente

---

### Test 7.3: Persistencia de Datos
**Objetivo**: Verificar que los datos persisten

**Pasos**:
1. Crear trabajador y fichajes
2. Recargar página
3. Verificar que datos siguen ahí
4. Cerrar navegador
5. Volver a abrir
6. Verificar que datos persisten

**Resultado Esperado**: ✅ Persistencia en BD funciona

**Estado**: ⬜ Pendiente

---

## 📊 Resumen de Tests

- **Total Tests**: 32
- **Completados**: 0
- **Fallidos**: 0
- **Pendientes**: 32

---

## 🐛 Bugs Encontrados

[Lista de bugs encontrados durante la ejecución de tests]

---

## ✅ Correcciones Aplicadas

[Lista de correcciones realizadas]

