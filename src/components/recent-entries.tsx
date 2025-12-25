'use client';

import { Worker, TimeEntry } from '../types';
import { formatTime, formatDateTime } from '../lib/storage';
import { getInitials, getRandomColor, isToday, isThisWeek } from '../lib/utils';

interface RecentEntriesProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
}

export default function RecentEntries({ workers, timeEntries }: RecentEntriesProps) {
  // Get the 10 most recent entries
  const recentEntries = [...timeEntries]
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
    .slice(0, 10)
    .map(entry => {
      const worker = workers.find(w => w.id === entry.workerId);
      return { ...entry, worker };
    })
    .filter(item => item.worker);

  const getEntryType = (entry: TimeEntry & { worker: Worker }) => {
    if (!entry.clockOut) return 'entrada';
    
    const clockInTime = new Date(entry.clockIn);
    const clockOutTime = new Date(entry.clockOut);
    const timeDiff = clockOutTime.getTime() - clockInTime.getTime();
    const hoursWorked = timeDiff / (1000 * 60 * 60);
    
    if (hoursWorked < 0.5) return 'salida-temprana';
    if (hoursWorked > 10) return 'jornada-larga';
    return 'salida';
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'salida':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'salida-temprana':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'jornada-larga':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'bg-green-50 border-green-200';
      case 'salida':
        return 'bg-blue-50 border-blue-200';
      case 'salida-temprana':
        return 'bg-yellow-50 border-yellow-200';
      case 'jornada-larga':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getEntryLabel = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      case 'salida-temprana':
        return 'Salida temprana';
      case 'jornada-larga':
        return 'Jornada larga';
      default:
        return 'Registro';
    }
  };

  if (recentEntries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">No hay actividad reciente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Actividad Reciente
        </h3>
        
        <div className="space-y-3">
          {recentEntries.map((entry) => {
            const entryType = getEntryType(entry);
            const colorClass = getEntryColor(entryType);
            const label = getEntryLabel(entryType);
            
            return (
              <div key={entry.id} className={`border rounded-lg p-4 ${colorClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor()}`}>
                      {getInitials(entry.worker.name)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{entry.worker.name}</h4>
                      <p className="text-sm text-gray-600">{entry.worker.position}</p>
                      <p className="text-xs text-gray-500">
                        {isToday(entry.clockIn) ? 'Hoy' : 
                         isThisWeek(entry.clockIn) ? 
                         new Date(entry.clockIn).toLocaleDateString('es-ES', { weekday: 'short' }) :
                         formatTime(new Date(entry.clockIn))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {getEntryIcon(entryType)}
                      <span className="text-sm font-medium text-gray-700">
                        {label}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatTime(new Date(entry.clockIn))}
                      {entry.clockOut && (
                        <span className="text-gray-500"> - {formatTime(new Date(entry.clockOut))}</span>
                      )}
                    </div>
                    {entry.totalHours && (
                      <div className="text-sm text-gray-600">
                        {entry.totalHours.toFixed(1)}h 
                        {entry.overtime && entry.overtime > 0 && (
                          <span className="text-red-600"> (+{entry.overtime.toFixed(1)}h extra)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{entry.location.address}</span>
                  </div>
                </div>

                {/* Break info */}
                {entry.breakStart && entry.breakEnd && (
                  <div className="mt-2 text-xs text-gray-600">
                    Descanso: {formatTime(new Date(entry.breakStart))} - {formatTime(new Date(entry.breakEnd))}
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