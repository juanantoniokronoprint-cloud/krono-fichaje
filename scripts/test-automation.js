/**
 * Script de Tests Automatizados para Krono Fichaje
 * Ejecuta una batería completa de tests funcionales
 */

const BASE_URL = process.env.TEST_URL || 'http://54.37.158.9:3001';
const ADMIN_PIN = process.env.ADMIN_PIN || '123456';

const testResults = {
  passed: [],
  failed: [],
  total: 0
};

function logTest(name, passed, message = '') {
  testResults.total++;
  const result = {
    name,
    passed,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ ${name}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ ${name}: ${message}`);
  }
}

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}/api${endpoint}`, options);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Iniciando batería de tests funcionales...\n');
  
  // Test 1: API de Workers
  console.log('📋 Test 1: API de Trabajadores');
  const workersResult = await testAPI('/workers');
  logTest('GET /api/workers', workersResult.ok, workersResult.error || `Status: ${workersResult.status}`);
  
  // Test 2: Crear trabajador de prueba
  console.log('\n📋 Test 2: Crear Trabajador');
  const testWorker = {
    name: 'Test Usuario',
    email: `test${Date.now()}@test.com`,
    position: 'Tester',
    department: 'QA',
    hireDate: new Date().toISOString().split('T')[0],
    hourlyRate: 15.00,
    isActive: true,
    employeeNumber: '9999'
  };
  
  const createResult = await testAPI('/workers', 'POST', testWorker);
  logTest('POST /api/workers', createResult.ok && createResult.data.id, createResult.error || JSON.stringify(createResult.data));
  
  const workerId = createResult.data?.id;
  
  // Test 3: Obtener trabajador específico
  if (workerId) {
    console.log('\n📋 Test 3: Obtener Trabajador');
    const getWorkerResult = await testAPI(`/workers/${workerId}`);
    logTest(`GET /api/workers/${workerId}`, getWorkerResult.ok && getWorkerResult.data.id === workerId);
  }
  
  // Test 4: API de Time Entries
  console.log('\n📋 Test 4: API de Time Entries');
  const entriesResult = await testAPI('/time-entries');
  logTest('GET /api/time-entries', entriesResult.ok, entriesResult.error || `Status: ${entriesResult.status}`);
  
  // Test 5: Crear time entry
  if (workerId) {
    console.log('\n📋 Test 5: Crear Time Entry');
    const testEntry = {
      workerId: workerId,
      clockIn: new Date().toISOString(),
      approvalStatus: 'auto-approved'
    };
    
    const createEntryResult = await testAPI('/time-entries', 'POST', testEntry);
    logTest('POST /api/time-entries', createEntryResult.ok && createEntryResult.data.id, createEntryResult.error || JSON.stringify(createEntryResult.data));
    
    const entryId = createEntryResult.data?.id;
    
    // Test 6: Actualizar time entry (clock out)
    if (entryId) {
      console.log('\n📋 Test 6: Actualizar Time Entry (Salida)');
      const updateData = {
        clockOut: new Date().toISOString(),
        totalHours: 8.0,
        overtime: 0.0
      };
      
      const updateResult = await testAPI(`/time-entries/${entryId}`, 'PUT', updateData);
      logTest(`PUT /api/time-entries/${entryId}`, updateResult.ok, updateResult.error || JSON.stringify(updateResult.data));
    }
  }
  
  // Test 7: API de Settings
  console.log('\n📋 Test 7: API de Settings');
  const settingsResult = await testAPI('/settings');
  logTest('GET /api/settings', settingsResult.ok && (settingsResult.data.adminPin || settingsResult.data.admin_pin), settingsResult.error || JSON.stringify(settingsResult.data));
  
  // Test 8: API de Stats
  console.log('\n📋 Test 8: API de Estadísticas');
  const statsResult = await testAPI('/stats?type=dashboard');
  logTest('GET /api/stats', statsResult.ok && statsResult.data.totalWorkers !== undefined, statsResult.error || JSON.stringify(statsResult.data));
  
  // Test 9: Limpiar - Eliminar trabajador de prueba
  if (workerId) {
    console.log('\n📋 Test 9: Limpieza');
    const deleteResult = await testAPI(`/workers/${workerId}`, 'DELETE');
    logTest(`DELETE /api/workers/${workerId}`, deleteResult.ok || deleteResult.status === 404, deleteResult.error || JSON.stringify(deleteResult.data));
  }
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(50));
  console.log(`Total: ${testResults.total}`);
  console.log(`✅ Pasados: ${testResults.passed.length}`);
  console.log(`❌ Fallidos: ${testResults.failed.length}`);
  console.log(`📈 Tasa de éxito: ${((testResults.passed.length / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ TESTS FALLIDOS:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\n✅ Tests completados');
  
  return testResults;
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runTests().then(results => {
    process.exit(results.failed.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testAPI, logTest };

