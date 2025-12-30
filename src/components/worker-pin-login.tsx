'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/api-storage';
import { TimeCalculator } from '../lib/time-calculations';

interface WorkerPinLoginProps {
  onClockIn?: (entry: TimeEntry) => void;
  onClockOut?: (entry: TimeEntry) => void;
}

export default function WorkerPinLogin({ onClockIn, onClockOut }: WorkerPinLoginProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authenticatedWorker, setAuthenticatedWorker] = useState<Worker | null>(null);

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();
    if (!trimmedPin) return;

    setIsLoading(true);
    setMessage('');

    // Try to find worker by employeeNumber first, then by id (for backward compatibility)
    const worker = workers.find(w => {
      // Match by employeeNumber if it exists (exact match)
      if (w.employeeNumber && w.employeeNumber.toString().trim() === trimmedPin) {
        return true;
      }
      // Match by full id
      if (w.id === trimmedPin) {
        return true;
      }
      // Match by last 6 characters of id (for workers without employeeNumber)
      if (w.id.slice(-6) === trimmedPin) {
        return true;
      }
      // Try matching employeeNumber without leading zeros
      if (w.employeeNumber) {
        const empNum = w.employeeNumber.toString().trim();
        const pinWithoutZeros = trimmedPin.replace(/^0+/, '');
        if (empNum.replace(/^0+/, '') === pinWithoutZeros) {
          return true;
        }
      }
      return false;
    });
    
    if (worker) {
      setAuthenticatedWorker(worker);
      setMessage(`¡Bienvenido ${worker.name}!`);
      setPin(''); // Clear PIN after successful login
    } else {
      setMessage('PIN incorrecto. Por favor intenta de nuevo.');
      setPin('');
    }
    
    setIsLoading(false);
  };

  const handleClockAction = async () => {
    if (!authenticatedWorker) {
      setMessage('Por favor ingresa tu PIN primero');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const workerId = authenticatedWorker.id;

      const activeEntries = await TimeEntryStorage.getActiveEntries();
      const hasActiveEntry = activeEntries.some(entry => entry.workerId === workerId && !entry.clockOut);

      if (hasActiveEntry) {
        // Clock out
        const activeEntries = await TimeEntryStorage.getActiveEntries();
        const activeEntry = activeEntries.find(entry => entry.workerId === workerId && !entry.clockOut);
        
        if (activeEntry) {
          const clockOut = new Date().toISOString();
          
          // Update the entry with clock out time
          await TimeEntryStorage.update(activeEntry.id, {
            clockOut
          });

          // Calculate hours using the new time calculator
          const allEntries = await TimeEntryStorage.getAll();
          const updatedEntry = allEntries.find(e => e.id === activeEntry.id);
          if (updatedEntry) {
            const calculation = TimeCalculator.calculateEntryHours(updatedEntry);
            
            setMessage(`¡Hasta luego ${authenticatedWorker.name}! Has trabajado ${calculation.netHours.toFixed(1)} horas netas.`);
            onClockOut?.(updatedEntry);
          }
        }
      } else {
        // Clock in
        const newEntry = await TimeEntryStorage.create({
          workerId,
          clockIn: new Date().toISOString(),
          approvalStatus: 'auto-approved'
        });

        setMessage(`¡Bienvenido ${authenticatedWorker.name}! Has fichado a las ${new Date().toLocaleTimeString('es-ES')}.`);
        onClockIn?.(newEntry);
      }

      // Refresh workers list to update active status
      const allWorkers = await WorkerStorage.getAll();
      setWorkers(allWorkers.filter(w => w.isActive));
      
    } catch (error) {
      setMessage('Error al registrar el fichaje. Por favor, intenta de nuevo.');
      console.error('Clock error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticatedWorker(null);
    setPin('');
    setMessage('Sesión cerrada. Por favor ingresa tu PIN.');
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

  // PIN Input Screen
  if (!authenticatedWorker) {
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

          {/* PIN Login Form */}
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu PIN:
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="••••••"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="w-full py-4 px-6 rounded-lg text-white font-bold text-xl transition-all duration-200 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Validando...
                </div>
              ) : (
                'INGRESAR'
              )}
            </button>
          </form>

          {/* PIN Pad */}
          <div className="mt-6">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => setPin(prev => prev + num)}
                  className="h-16 text-2xl font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPin(prev => prev + '0')}
                className="h-16 text-2xl font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => setPin('')}
                className="h-16 text-lg font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors"
              >
                BORRAR
              </button>
              <button
                onClick={() => setPin(prev => prev.slice(0, -1))}
                className="h-16 text-lg font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                ←
              </button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.includes('incorrecto') || message.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : message.includes('Bienvenido')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {message}
            </div>
          )}

          {/* Demo PINs */}
          {workers.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">PINs disponibles:</h3>
              <div className="space-y-2">
                {workers.slice(0, 4).map((worker) => {
                  // Use employeeNumber if available, otherwise use last 6 chars of ID
                  const displayPin = worker.employeeNumber || worker.id.slice(-6);
                  return (
                    <div key={worker.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{worker.name}</div>
                        <div className="text-gray-600">{worker.position}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPin(displayPin)}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors font-mono"
                      >
                        {displayPin}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Ingresa tu PIN y toca INGRESAR para fichar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Worker Dashboard (after PIN authentication) - We'll load this in useEffect
  const [hasActiveEntry, setHasActiveEntry] = useState(false);

  useEffect(() => {
    const checkActiveEntry = async () => {
      if (authenticatedWorker) {
        const activeEntries = await TimeEntryStorage.getActiveEntries();
        setHasActiveEntry(activeEntries.some(entry => entry.workerId === authenticatedWorker.id && !entry.clockOut));
      }
    };
    checkActiveEntry();
    const interval = setInterval(checkActiveEntry, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [authenticatedWorker]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-green-600">
              {authenticatedWorker.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {authenticatedWorker.name}
          </h1>
          <p className="text-gray-600">{authenticatedWorker.position}</p>
          <p className="text-sm text-gray-500">{authenticatedWorker.department}</p>
        </div>

        {/* Current Time Display */}
        <div className="text-center mb-8">
          <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Clock In/Out Button */}
        <button
          onClick={handleClockAction}
          disabled={isLoading}
          className={`w-full py-6 px-6 rounded-lg text-white font-bold text-2xl transition-all duration-200 ${
            hasActiveEntry
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
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
            message.includes('Error') || message.includes('incorrecto')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : message.includes('Bienvenido') || message.includes('Hasta luego')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cambiar de Trabajador
          </button>
          
          <button
            onClick={() => {
              // Admin login - could show admin PIN screen
              setMessage('Para acceder al modo administrador, contacta al administrador del sistema.');
            }}
            className="w-full py-3 px-4 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
          >
            Modo Administrador
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {hasActiveEntry
              ? 'Toca "FICHAR SALIDA" cuando termines tu jornada'
              : 'Toca "FICHAR ENTRADA" para comenzar tu jornada laboral'}
          </p>
        </div>
      </div>
    </div>
  );
}