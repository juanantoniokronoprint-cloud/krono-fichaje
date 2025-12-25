'use client';

import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/storage';
import { formatTime, formatDuration } from '../lib/storage';
import { getInitials, getRandomColor, getStatusColor } from '../lib/utils';
import { useState, useEffect } from 'react';

interface ActiveWorkersListProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
}

export default function ActiveWorkersList({ workers, timeEntries }: ActiveWorkersListProps) {
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every second
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeTimer);
  }, []);

  useEffect(() => {
    // Update elapsed times for active workers
    const updateElapsedTimes = () => {
      const newElapsedTimes: Record<string, string> = {};
      
      activeWorkers.forEach(entry => {
        const startTime = new Date(entry.clockIn);
        const now = new Date();
        const diffMs = now.getTime() - startTime.getTime();
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          newElapsedTimes[entry.workerId] = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      
      setElapsedTimes(newElapsedTimes);
    };

    updateElapsedTimes();
    
    // Update elapsed times every second
    const elapsedTimer = setInterval(updateElapsedTimes, 1000);
    
    return () => clearInterval(elapsedTimer);
  }, [activeWorkers]);

  const activeEntries = timeEntries.filter(entry => !entry.clockOut);
  const activeWorkers = activeEntries.map(entry => {
    const worker = workers.find(w => w.id === entry.workerId);
    return {
      ...entry,
      worker,
    };
  }).filter(item => item.worker);

  const getWorkerStatus = (entry: TimeEntry & { worker: Worker }) => {
    if (entry.breakStart && !entry.breakEnd) return 'on-break';
    return 'active';
  };

  if (activeWorkers.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Trabajadores Activos
          </h3>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No hay trabajadores activos en este momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Trabajadores Activos ({activeWorkers.length})
          </h3>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString('es-ES')}
          </div>
        </div>
        
        <div className="space-y-4">
          {activeWorkers.map((item) => {
            const status = getWorkerStatus(item);
            const statusColor = getStatusColor(status);
            const elapsedTime = elapsedTimes[item.workerId] || '00:00:00';
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor()}`}>
                      {getInitials(item.worker.name)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.worker.name}</h4>
                      <p className="text-sm text-gray-600">{item.worker.position}</p>
                      <p className="text-xs text-gray-500">{item.worker.department}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {status === 'active' ? 'Trabajando' : 'En pausa'}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-gray-900">
                      {elapsedTime}
                    </div>
                    <div className="text-sm text-gray-600">
                      Entrada: {formatTime(new Date(item.clockIn))}
                    </div>
                  </div>
                </div>

                {/* Location info */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{item.location.address}</span>
                  </div>
                </div>

                {/* Break info */}
                {item.breakStart && !item.breakEnd && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                    <span className="text-yellow-700">
                      En descanso desde {formatTime(new Date(item.breakStart))}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}