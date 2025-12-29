'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage, LocationService } from '../lib/storage';
import { TimeCalculator } from '../lib/time-calculations';

interface WorkerClockProps {
  onTimeEntry?: (entry: TimeEntry) => void;
}

export default function WorkerClock({ onTimeEntry }: WorkerClockProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load active workers
    const activeWorkers = WorkerStorage.getActive();
    setWorkers(activeWorkers);

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const hasActiveEntry = selectedWorkerId && TimeEntryStorage.getActiveEntries()
    .some(entry => entry.workerId === selectedWorkerId && !entry.clockOut);

  const handleClockAction = async () => {
    if (!selectedWorkerId) {
      setMessage('Por favor selecciona tu nombre');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const location = await LocationService.getCurrentLocation();
      
      if (hasActiveEntry) {
        // Clock out
        const activeEntry = TimeEntryStorage.getActiveEntries()
          .find(entry => entry.workerId === selectedWorkerId && !entry.clockOut);
        
        if (activeEntry) {
          const clockOut = new Date().toISOString();
          
          // Update the entry with clock out time
          TimeEntryStorage.update(activeEntry.id, {
            clockOut,
            location
          });

          // Calculate hours using the new time calculator
          const updatedEntry = TimeEntryStorage.getAll().find(e => e.id === activeEntry.id);
          if (updatedEntry) {
            const worker = workers.find(w => w.id === selectedWorkerId);
            const calculation = TimeCalculator.calculateEntryHours(updatedEntry);
            
            setMessage(`¡Hasta luego ${selectedWorker?.name}! Has trabajado ${calculation.netHours.toFixed(1)} horas netas.`);
          }
        }
      } else {
        // Clock in
        const newEntry = TimeEntryStorage.create({
          workerId: selectedWorkerId,
          clockIn: new Date().toISOString(),
          location,
          approvalStatus: 'auto-approved'
        });

        onTimeEntry?.(newEntry);
        setMessage(`¡Bienvenido ${selectedWorker?.name}! Has fichado correctamente.`);
      }

      // Refresh workers list to update active status
      setWorkers(WorkerStorage.getActive());
      
    } catch (error) {
      setMessage('Error al obtener la ubicación. Asegúrate de permitir el acceso a la ubicación.');
      console.error('Location error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Control de Fichaje
          </h1>
          <div className="text-sm text-gray-600">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-center mb-8">
          <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-500">
            Hora actual
          </div>
        </div>

        {/* Worker Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu nombre:
          </label>
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            <option value="">-- Seleccionar trabajador --</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name} - {worker.position}
              </option>
            ))}
          </select>
        </div>

        {/* Clock In/Out Button */}
        <button
          onClick={handleClockAction}
          disabled={!selectedWorkerId || isLoading}
          className={`w-full py-4 px-6 rounded-lg text-white font-bold text-xl transition-all duration-200 ${
            hasActiveEntry
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              Procesando...
            </div>
          ) : hasActiveEntry ? (
            'FICHAR SALIDA'
          ) : (
            'FICHAR ENTRADA'
          )}
        </button>

        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
            message.includes('Error') || message.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : message.includes('Bienvenido') || message.includes('Hasta luego')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {message}
          </div>
        )}

        {/* Worker Status */}
        {selectedWorker && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Trabajador:</div>
            <div className="font-medium text-gray-900">{selectedWorker.name}</div>
            <div className="text-sm text-gray-600">{selectedWorker.position}</div>
            <div className="text-sm text-gray-600">{selectedWorker.department}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {hasActiveEntry
              ? 'Toca "FICHAR SALIDA" cuando termines tu jornada'
              : 'Selecciona tu nombre y toca "FICHAR ENTRADA" para comenzar'}
          </p>
        </div>
      </div>
    </div>
  );
}