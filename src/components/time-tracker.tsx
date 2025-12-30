'use client';

import { useState, useEffect } from 'react';
import { Worker, TimeEntry, Location } from '../types';
import { WorkerStorage, TimeEntryStorage, calculateTotalHours, calculateOvertime } from '../lib/storage';
import { formatTime, formatDuration } from '../lib/storage';
import { ErrorHandler, ErrorType, ErrorSeverity, BusinessLogicError } from '../lib/error-handler';
import { useNotificationContext } from './notification-provider';
import LoadingSpinner from './loading-spinner';
import ConfirmationDialog from './confirmation-dialog';

interface TimeTrackerProps {
  worker: Worker;
  onUpdate: () => void;
}

export default function TimeTracker({ worker, onUpdate }: TimeTrackerProps) {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const notifications = useNotificationContext();

  useEffect(() => {
    // Load active entry for this worker
    const loadActiveEntry = async () => {
      try {
        const entries = await TimeEntryStorage.getAll();
        const entry = entries.find(e => e.workerId === worker.id && !e.clockOut);
        setActiveEntry(entry || null);

        // Check if worker is on break
        if (entry?.breakStart && !entry?.breakEnd) {
          setIsOnBreak(true);
        }

        // Start elapsed time timer if active
        if (entry) {
          const timer = setInterval(() => {
            updateElapsedTime(entry.clockIn);
          }, 1000);
          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Error loading active entry:', error);
      }
    };
    loadActiveEntry();
  }, [worker.id]);

  useEffect(() => {
    // Update elapsed time every second
    if (activeEntry && !isOnBreak) {
      const timer = setInterval(() => {
        updateElapsedTime(activeEntry.clockIn);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeEntry, isOnBreak]);

  const updateElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    if (diffMs < 0) return;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const handleClockIn = async () => {
    if (!worker.isActive) {
      notifications.showError('Este trabajador está inactivo. Contacta al administrador.');
      return;
    }

    setIsLoading(true);
    setLocationError(null);

    try {
      // Check if worker already has an active entry (prevent double clock-in)
      const allEntries = await TimeEntryStorage.getAll();
      const existingActiveEntry = allEntries.find(
        entry => entry.workerId === worker.id && !entry.clockOut
      );

      if (existingActiveEntry) {
        throw new BusinessLogicError(
          'Worker already has an active entry',
          'Este trabajador ya tiene una entrada activa. Por favor, registra la salida primero.',
          'DUPLICATE_CLOCK_IN'
        );
      }

      // Create new time entry
      const newEntry: Omit<TimeEntry, 'id'> = {
        workerId: worker.id,
        clockIn: new Date().toISOString(),
        location: { latitude: 0, longitude: 0, address: '' },
        approvalStatus: 'auto-approved',
      };

      const createdEntry = await TimeEntryStorage.create(newEntry);
      setActiveEntry(createdEntry);
      updateElapsedTime(createdEntry.clockIn);
      onUpdate();
      
      notifications.showSuccess('Entrada registrada correctamente');
    } catch (error) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.BUSINESS_LOGIC,
        ErrorSeverity.MEDIUM,
        { operation: 'clockIn', workerId: worker.id }
      );
      
      setLocationError(appError.userMessage);
      notifications.showError(appError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    // Show confirmation with hours summary
    setShowClockOutConfirm(true);
  };

  const confirmClockOut = async () => {
    if (!activeEntry) return;

    setShowClockOutConfirm(false);
    setIsLoading(true);

    try {
      const clockOutTime = new Date().toISOString();
      const breakMinutes = calculateBreakMinutes(activeEntry);
      const totalHours = calculateTotalHours(activeEntry.clockIn, clockOutTime, breakMinutes);
      const overtimeHours = calculateOvertime(totalHours);

      const updatedEntry: Partial<TimeEntry> = {
        clockOut: clockOutTime,
        totalHours,
        overtime: overtimeHours,
      };

      // End break if currently on break
      if (isOnBreak) {
        updatedEntry.breakEnd = clockOutTime;
      }

      const updated = await TimeEntryStorage.update(activeEntry.id, updatedEntry);
      if (!updated) {
        throw new Error('No se pudo actualizar el registro de salida');
      }

      setActiveEntry(null);
      setIsOnBreak(false);
      setElapsedTime('00:00:00');
      onUpdate();

      notifications.showSuccess(
        `Salida registrada. Has trabajado ${totalHours.toFixed(1)} horas${overtimeHours > 0 ? ` (${overtimeHours.toFixed(1)} horas extra)` : ''}.`
      );
    } catch (error) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'clockOut', entryId: activeEntry.id }
      );
      
      notifications.showError(appError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!activeEntry || isOnBreak) return;

    setIsLoading(true);
    try {
      const breakStartTime = new Date().toISOString();
      await TimeEntryStorage.update(activeEntry.id, { breakStart: breakStartTime });
      setIsOnBreak(true);
      onUpdate();
      notifications.showInfo('Descanso iniciado');
    } catch (error) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'startBreak', entryId: activeEntry.id }
      );
      notifications.showError(appError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!activeEntry || !isOnBreak) return;

    setIsLoading(true);
    try {
      const breakEndTime = new Date().toISOString();
      await TimeEntryStorage.update(activeEntry.id, { breakEnd: breakEndTime });
      setIsOnBreak(false);
      onUpdate();
      notifications.showInfo('Descanso finalizado');
    } catch (error) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'endBreak', entryId: activeEntry.id }
      );
      notifications.showError(appError.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBreakMinutes = (entry: TimeEntry): number => {
    if (!entry.breakStart || !entry.breakEnd) return 0;
    
    const breakStart = new Date(entry.breakStart);
    const breakEnd = new Date(entry.breakEnd);
    return Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
  };

  const getCurrentTotalHours = (): number => {
    if (!activeEntry) return 0;
    
    const now = new Date();
    const breakMinutes = isOnBreak && activeEntry.breakStart 
      ? Math.floor((now.getTime() - new Date(activeEntry.breakStart).getTime()) / (1000 * 60))
      : calculateBreakMinutes(activeEntry);
    
    return calculateTotalHours(activeEntry.clockIn, now.toISOString(), breakMinutes);
  };

  const getOvertimeHours = (): number => {
    return calculateOvertime(getCurrentTotalHours());
  };

  if (activeEntry) {
    const totalHours = getCurrentTotalHours();
    const overtimeHours = getOvertimeHours();

    return (
      <>
        <ConfirmationDialog
          isOpen={showClockOutConfirm}
          title="Confirmar Salida"
          message={`¿Estás seguro de que deseas registrar la salida? Has trabajado ${totalHours.toFixed(1)} horas${overtimeHours > 0 ? ` (${overtimeHours.toFixed(1)} horas extra)` : ''}.`}
          confirmLabel="Sí, Registrar Salida"
          cancelLabel="Cancelar"
          variant="info"
          onConfirm={confirmClockOut}
          onCancel={() => setShowClockOutConfirm(false)}
        />
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Trabajando</h3>
          <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
            {elapsedTime}
          </div>
          <p className="text-sm text-gray-600">
            Entrada: {formatTime(new Date(activeEntry.clockIn))}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-blue-700">Total Hoy</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{overtimeHours.toFixed(1)}h</div>
            <div className="text-sm text-red-700">Horas Extra</div>
          </div>
        </div>

        {/* Location Info */}
        {location && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location.address}
            </div>
          </div>
        )}

        {/* Break Controls */}
        <div className="mb-6">
          {isOnBreak ? (
            <button
              onClick={handleEndBreak}
              disabled={isLoading}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Finalizando descanso...' : 'Finalizar Descanso'}
            </button>
          ) : (
            <button
              onClick={handleStartBreak}
              disabled={isLoading}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Iniciando descanso...' : 'Iniciar Descanso'}
            </button>
          )}
        </div>

        {/* Clock Out Button */}
        <button
          onClick={handleClockOut}
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-4 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 font-bold text-lg"
        >
          {isLoading ? 'Registrando salida...' : 'Registrar Salida'}
        </button>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Listo para trabajar</h3>
        <p className="text-gray-600">Haz clic para registrar tu entrada</p>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{locationError}</p>
        </div>
      )}

      {/* Clock In Button */}
      <button
        onClick={handleClockIn}
        disabled={isLoading || !worker.isActive}
        className="w-full bg-green-600 text-white py-4 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
      >
        {isLoading ? 'Obteniendo ubicación...' : 
         !worker.isActive ? 'Trabajador Inactivo' : 
         'Registrar Entrada'}
      </button>

      {!worker.isActive && (
        <p className="text-center text-red-600 text-sm mt-2">
          Este trabajador está inactivo. Contacta al administrador.
        </p>
      )}
    </div>
  );
}