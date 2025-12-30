'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/api-storage';
import { TimeCalculator } from '../lib/time-calculations';
import { ErrorHandler, ErrorType, ErrorSeverity, BusinessLogicError } from '../lib/error-handler';
import { useNotificationContext } from './notification-provider';
import { InlineSpinner } from './loading-spinner';

interface WorkerClockProps {
  onTimeEntry?: (entry: TimeEntry) => void;
}

export default function WorkerClock({ onTimeEntry }: WorkerClockProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasActiveEntry, setHasActiveEntry] = useState(false);
  const notifications = useNotificationContext();

  useEffect(() => {
    // Load active workers
    const loadWorkers = async () => {
      const activeWorkers = await WorkerStorage.getActive();
      setWorkers(activeWorkers);
    };
    loadWorkers();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkActiveEntry = async () => {
      if (selectedWorkerId) {
        const activeEntries = await TimeEntryStorage.getActiveEntries();
        setHasActiveEntry(activeEntries.some(entry => entry.workerId === selectedWorkerId && !entry.clockOut));
      } else {
        setHasActiveEntry(false);
      }
    };
    checkActiveEntry();
  }, [selectedWorkerId]);

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  const handleClockAction = async () => {
    if (!selectedWorkerId) {
      notifications.showWarning('Por favor selecciona tu nombre');
      return;
    }

    const worker = selectedWorker;
    if (!worker || !worker.isActive) {
      notifications.showError('Este trabajador está inactivo. Contacta al administrador.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Check for double clock-in/out
      const currentActiveEntries = await TimeEntryStorage.getActiveEntries();
      const existingEntry = currentActiveEntries.find(
        entry => entry.workerId === selectedWorkerId && !entry.clockOut
      );

      if (hasActiveEntry && !existingEntry) {
        throw new BusinessLogicError(
          'Active entry state mismatch',
          'El estado de la entrada activa no coincide. Por favor, recarga la página.',
          'STATE_MISMATCH'
        );
      }

      const location = { latitude: 0, longitude: 0, address: '' };
      
      if (hasActiveEntry && existingEntry) {
        // Clock out
        const clockOut = new Date().toISOString();
        
        // Update the entry with clock out time
        const updatedEntry = await TimeEntryStorage.update(existingEntry.id, {
          clockOut,
          location
        });

        // Calculate hours using the new time calculator
        if (updatedEntry) {
          const calculation = TimeCalculator.calculateEntryHours(updatedEntry);
          const successMessage = `¡Hasta luego ${worker.name}! Has trabajado ${calculation.netHours.toFixed(1)} horas netas.`;
          setMessage(successMessage);
          notifications.showSuccess(successMessage);
          onTimeEntry?.(updatedEntry);
        }
      } else {
        // Clock in - prevent double clock-in
        if (existingEntry) {
          throw new BusinessLogicError(
            'Worker already has an active entry',
            'Ya tienes una entrada activa. Por favor, registra la salida primero.',
            'DUPLICATE_CLOCK_IN'
          );
        }

        const newEntry = await TimeEntryStorage.create({
          workerId: selectedWorkerId,
          clockIn: new Date().toISOString(),
          location,
          approvalStatus: 'auto-approved'
        });

        const successMessage = `¡Bienvenido ${worker.name}! Has fichado correctamente.`;
        setMessage(successMessage);
        notifications.showSuccess(successMessage);
        onTimeEntry?.(newEntry);
      }

      // Refresh workers list to update active status
      const activeWorkers = await WorkerStorage.getActive();
      setWorkers(activeWorkers);
      
    } catch (error) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.BUSINESS_LOGIC,
        ErrorSeverity.MEDIUM,
        { operation: 'clockAction', workerId: selectedWorkerId }
      );
      
      setMessage(appError.userMessage);
      notifications.showError(appError.userMessage);
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
              <InlineSpinner size="md" className="border-white mr-2" />
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