'use client';

import { useState, useEffect } from 'react';
import { Worker, TimeEntry, Location } from '../types';
import { WorkerStorage, TimeEntryStorage, LocationService, calculateTotalHours, calculateOvertime } from '../lib/storage';
import { formatTime, formatDuration } from '../lib/storage';

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

  useEffect(() => {
    // Load active entry for this worker
    const entries = TimeEntryStorage.getAll();
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
      alert('Este trabajador está inactivo. Contacta al administrador.');
      return;
    }

    setIsLoading(true);
    setLocationError(null);

    try {
      // Get current location
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);

      // Check if worker already has an active entry
      const existingActiveEntry = TimeEntryStorage.getAll().find(
        entry => entry.workerId === worker.id && !entry.clockOut
      );

      if (existingActiveEntry) {
        alert('Este trabajador ya tiene una entrada activa.');
        return;
      }

      // Create new time entry
      const newEntry: Omit<TimeEntry, 'id'> = {
        workerId: worker.id,
        clockIn: new Date().toISOString(),
        location: currentLocation,
      };

      const createdEntry = TimeEntryStorage.create(newEntry);
      setActiveEntry(createdEntry);
      updateElapsedTime(createdEntry.clockIn);
      onUpdate();

    } catch (error) {
      console.error('Error clocking in:', error);
      setLocationError(error instanceof Error ? error.message : 'Error al obtener la ubicación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

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

      TimeEntryStorage.update(activeEntry.id, updatedEntry);
      setActiveEntry(null);
      setIsOnBreak(false);
      setElapsedTime('00:00:00');
      onUpdate();

    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Error al registrar la salida');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!activeEntry || isOnBreak) return;

    setIsLoading(true);
    try {
      const breakStartTime = new Date().toISOString();
      TimeEntryStorage.update(activeEntry.id, { breakStart: breakStartTime });
      setIsOnBreak(true);
      onUpdate();
    } catch (error) {
      console.error('Error starting break:', error);
      alert('Error al iniciar el descanso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!activeEntry || !isOnBreak) return;

    setIsLoading(true);
    try {
      const breakEndTime = new Date().toISOString();
      TimeEntryStorage.update(activeEntry.id, { breakEnd: breakEndTime });
      setIsOnBreak(false);
      onUpdate();
    } catch (error) {
      console.error('Error ending break:', error);
      alert('Error al finalizar el descanso');
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