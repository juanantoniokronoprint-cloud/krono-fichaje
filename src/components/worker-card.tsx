'use client';

import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/api-storage';
import { getInitials, getRandomColor, getStatusColor, formatCurrency } from '../lib/utils';
import { useState, useEffect } from 'react';

interface WorkerCardProps {
  worker: Worker;
  onUpdate: () => void;
  onEdit: (worker: Worker) => void;
}

export default function WorkerCard({ worker, onUpdate, onEdit }: WorkerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [totalTodayHours, setTotalTodayHours] = useState(0);

  useEffect(() => {
    const loadEntryData = async () => {
      try {
        const allEntries = await TimeEntryStorage.getAll();
        const entry = allEntries.find(
          e => e.workerId === worker.id && !e.clockOut
        );
        setActiveEntry(entry || null);

        // Calculate today's hours
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = allEntries.filter(
          e => (e.clockIn.startsWith(today) || (e.clockOut && e.clockOut.startsWith(today))) && e.workerId === worker.id
        );
        const total = todayEntries.reduce((total, entry) => {
          if (entry.clockOut && entry.totalHours) {
            return total + entry.totalHours;
          }
          return total;
        }, 0);
        setTotalTodayHours(total);
      } catch (error) {
        console.error('Error loading entry data:', error);
      }
    };
    loadEntryData();
  }, [worker.id]);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await WorkerStorage.update(worker.id, { isActive: !worker.isActive });
      onUpdate();
    } catch (error) {
      console.error('Error updating worker status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${worker.name}?`)) {
      setIsLoading(true);
      try {
        // Check if worker has active entries
        const allEntries = await TimeEntryStorage.getAll();
        const hasActiveEntries = allEntries.some(
          entry => entry.workerId === worker.id && !entry.clockOut
        );

        if (hasActiveEntries) {
          alert('No se puede eliminar un trabajador con entradas activas.');
          return;
        }

        await WorkerStorage.delete(worker.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting worker:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getWorkerStatus = () => {
    if (!worker.isActive) return 'inactive';
    if (activeEntry?.breakStart && !activeEntry?.breakEnd) return 'on-break';
    if (activeEntry) return 'active';
    return 'inactive';
  };

  const status = getWorkerStatus();
  const statusColor = getStatusColor(status);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor()}`}>
            {getInitials(worker.name)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{worker.name}</h3>
            <p className="text-sm text-gray-600">{worker.position}</p>
            <p className="text-xs text-gray-500">{worker.department}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {status === 'active' ? 'Activo' : 
             status === 'on-break' ? 'En pausa' : 
             status === 'inactive' ? 'Inactivo' : 'Desactivado'}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(worker)}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              Editar
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={isLoading}
              className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
            >
              {worker.isActive ? 'Desactivar' : 'Activar'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Email:</span>
          <p className="font-medium">{worker.email}</p>
        </div>
        <div>
          <span className="text-gray-500">Salario/Hora:</span>
          <p className="font-medium">{formatCurrency(worker.hourlyRate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Fecha de contratación:</span>
          <p className="font-medium">{new Date(worker.hireDate).toLocaleDateString('es-ES')}</p>
        </div>
        <div>
          <span className="text-gray-500">Horas hoy:</span>
          <p className="font-medium">{totalTodayHours.toFixed(1)}h</p>
        </div>
      </div>

      {activeEntry && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">
              Entrada: {new Date(activeEntry.clockIn).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}