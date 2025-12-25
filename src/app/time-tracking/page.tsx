'use client';

import { useState, useEffect } from 'react';
import { Worker } from '../../types';
import { WorkerStorage, TimeEntryStorage } from '../../lib/storage';
import TimeTracker from '../../components/time-tracker';

export default function TimeTrackingPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = () => {
    setIsLoading(true);
    try {
      const allWorkers = WorkerStorage.getAll();
      setWorkers(allWorkers);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
  };

  const handleTimeUpdate = () => {
    // Refresh data when time is updated
    loadWorkers();
  };

  const activeWorkers = TimeEntryStorage.getActiveEntries();
  const workerStatuses = workers.map(worker => {
    const activeEntry = activeWorkers.find(entry => entry.workerId === worker.id);
    return {
      ...worker,
      isActive: !!activeEntry,
      isOnBreak: activeEntry?.breakStart && !activeEntry?.breakEnd,
      clockInTime: activeEntry?.clockIn,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl">
            Control de Tiempo
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Registra tu entrada y salida con geolocalización
          </p>
        </div>

        {/* Active Workers Status */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Estado Actual
            </h3>
            
            {activeWorkers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No hay trabajadores activos en este momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workerStatuses
                  .filter(worker => worker.isActive)
                  .map(worker => (
                    <div key={worker.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{worker.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.isOnBreak 
                            ? 'text-yellow-600 bg-yellow-100' 
                            : 'text-green-600 bg-green-100'
                        }`}>
                          {worker.isOnBreak ? 'En pausa' : 'Trabajando'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{worker.position}</p>
                      <p className="text-xs text-gray-500">
                        Entrada: {worker.clockInTime && new Date(worker.clockInTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Worker Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Seleccionar Trabajador
              </h3>
              
              <div className="space-y-3">
                {workers.map(worker => {
                  const activeEntry = activeWorkers.find(entry => entry.workerId === worker.id);
                  const isOnBreak = activeEntry?.breakStart && !activeEntry?.breakEnd;
                  
                  return (
                    <button
                      key={worker.id}
                      onClick={() => handleWorkerSelect(worker)}
                      disabled={!worker.isActive}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedWorker?.id === worker.id
                          ? 'border-blue-500 bg-blue-50'
                          : worker.isActive
                          ? 'border-gray-200 hover:border-gray-300 bg-white'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{worker.name}</h4>
                          <p className="text-sm text-gray-600">{worker.position}</p>
                          <p className="text-xs text-gray-500">{worker.department}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {activeEntry ? (
                            <>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isOnBreak 
                                  ? 'text-yellow-600 bg-yellow-100' 
                                  : 'text-green-600 bg-green-100'
                              }`}>
                                {isOnBreak ? 'En pausa' : 'Trabajando'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(activeEntry.clockIn).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </>
                          ) : worker.isActive ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                              Disponible
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {workers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay trabajadores registrados</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Contacta al administrador para agregar trabajadores
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Time Tracker */}
          <div>
            {selectedWorker ? (
              <TimeTracker
                worker={selectedWorker}
                onUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona un trabajador
                  </h3>
                  <p className="text-gray-500">
                    Elige un trabajador de la lista para comenzar el control de tiempo
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Instrucciones
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Selecciona tu nombre de la lista</li>
                  <li>Haz clic en "Registrar Entrada" para comenzar</li>
                  <li>Usa "Iniciar/Finalizar Descanso" para registrar pausas</li>
                  <li>Haz clic en "Registrar Salida" al finalizar tu jornada</li>
                  <li>Tu ubicación será registrada automáticamente por seguridad</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}