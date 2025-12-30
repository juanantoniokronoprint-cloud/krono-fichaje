'use client';

import { Worker, TimeEntry, FilterOptions } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/api-storage';
import { downloadCSV, exportToJSON } from '../lib/utils';

interface ExportButtonsProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
  filters: FilterOptions;
}

export default function ExportButtons({ workers, timeEntries, filters }: ExportButtonsProps) {
  const filterTimeEntries = (entries: TimeEntry[]) => {
    return entries.filter(entry => {
      // Date range filter
      if (filters.dateRange) {
        const entryDate = entry.clockIn.split('T')[0];
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return false;
        }
      }

      // Worker filter
      if (filters.workerId && entry.workerId !== filters.workerId) {
        return false;
      }

      // Department filter
      if (filters.department) {
        const worker = workers.find(w => w.id === entry.workerId);
        if (!worker || worker.department !== filters.department) {
          return false;
        }
      }

      // Status filter
      if (filters.status) {
        switch (filters.status) {
          case 'clocked-in':
            if (entry.clockOut) return false;
            break;
          case 'clocked-out':
            if (!entry.clockOut) return false;
            break;
          case 'on-break':
            if (!entry.breakStart || entry.breakEnd) return false;
            break;
        }
      }

      return true;
    });
  };

  const getFilteredData = () => {
    const filteredEntries = filterTimeEntries(timeEntries);
    
    // Enrich entries with worker data
    const enrichedEntries = filteredEntries.map(entry => {
      const worker = workers.find(w => w.id === entry.workerId);
      return {
        ...entry,
        workerName: worker?.name || 'Desconocido',
        workerEmail: worker?.email || '',
        workerPosition: worker?.position || '',
        workerDepartment: worker?.department || '',
        workerHourlyRate: worker?.hourlyRate || 0,
      };
    });

    return {
      entries: enrichedEntries,
      workers: workers.filter(w => {
        if (filters.department && w.department !== filters.department) return false;
        return true;
      }),
    };
  };

  const exportToCSV = () => {
    const { entries } = getFilteredData();
    
    if (entries.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados.');
      return;
    }

    const csvData = entries.map(entry => ({
      'Fecha': new Date(entry.clockIn).toLocaleDateString('es-ES'),
      'Trabajador': entry.workerName,
      'Email': entry.workerEmail,
      'Puesto': entry.workerPosition,
      'Departamento': entry.workerDepartment,
      'Hora Entrada': new Date(entry.clockIn).toLocaleTimeString('es-ES'),
      'Hora Salida': entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('es-ES') : '',
      'Inicio Descanso': entry.breakStart ? new Date(entry.breakStart).toLocaleTimeString('es-ES') : '',
      'Fin Descanso': entry.breakEnd ? new Date(entry.breakEnd).toLocaleTimeString('es-ES') : '',
      'Horas Totales': entry.totalHours ? entry.totalHours.toFixed(2) : '',
      'Horas Extra': entry.overtime ? entry.overtime.toFixed(2) : '',
      'Ubicación': entry.location.address,
      'Salario/Hora': entry.workerHourlyRate.toFixed(2),
      'Costo Total': entry.totalHours ? (entry.totalHours * entry.workerHourlyRate).toFixed(2) : '',
      'Costo Extra': entry.overtime ? (entry.overtime * entry.workerHourlyRate * 1.5).toFixed(2) : '',
    }));

    const filename = `reporte-tiempo-${filters.dateRange?.start || 'inicio'}-${filters.dateRange?.end || 'fin'}.csv`;
    downloadCSV(csvData, filename);
  };

  const exportToJSON = () => {
    const { entries, workers } = getFilteredData();
    
    if (entries.length === 0 && workers.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados.');
      return;
    }

    const exportData = {
      generatedAt: new Date().toISOString(),
      filters: filters,
      summary: {
        totalEntries: entries.length,
        totalWorkers: workers.length,
        totalHours: entries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0),
        totalOvertime: entries.reduce((sum, entry) => sum + (entry.overtime || 0), 0),
        totalPayroll: entries.reduce((sum, entry) => {
          const worker = workers.find(w => w.id === entry.workerId);
          if (worker && entry.totalHours) {
            const regularHours = Math.min(entry.totalHours, 8);
            const overtimeHours = Math.max(0, entry.totalHours - 8);
            return sum + (regularHours * worker.hourlyRate) + (overtimeHours * worker.hourlyRate * 1.5);
          }
          return sum;
        }, 0),
      },
      workers,
      timeEntries: entries,
    };

    const filename = `reporte-completo-${filters.dateRange?.start || 'inicio'}-${filters.dateRange?.end || 'fin'}.json`;
    exportToJSON(exportData, filename);
  };

  const exportSummaryReport = () => {
    const { entries } = getFilteredData();
    
    if (entries.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados.');
      return;
    }

    // Group by worker and calculate summary
    const workerSummaries = entries.reduce((acc, entry) => {
      const workerName = entry.workerName;
      if (!acc[workerName]) {
        acc[workerName] = {
          workerName,
          totalDays: 0,
          totalHours: 0,
          totalOvertime: 0,
          totalPayroll: 0,
          averageHoursPerDay: 0,
        };
      }

      acc[workerName].totalDays += 1;
      acc[workerName].totalHours += entry.totalHours || 0;
      acc[workerName].totalOvertime += entry.overtime || 0;
      
      const worker = workers.find(w => w.id === entry.workerId);
      if (worker && entry.totalHours) {
        const regularHours = Math.min(entry.totalHours, 8);
        const overtimeHours = Math.max(0, entry.totalHours - 8);
        acc[workerName].totalPayroll += (regularHours * worker.hourlyRate) + (overtimeHours * worker.hourlyRate * 1.5);
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(workerSummaries).forEach((summary: any) => {
      summary.averageHoursPerDay = summary.totalHours / summary.totalDays;
    });

    const csvData = Object.values(workerSummaries).map((summary: any) => ({
      'Trabajador': summary.workerName,
      'Días Trabajados': summary.totalDays,
      'Horas Totales': summary.totalHours.toFixed(2),
      'Horas Extra': summary.totalOvertime.toFixed(2),
      'Promedio Diario': summary.averageHoursPerDay.toFixed(2),
      'Costo Total': summary.totalPayroll.toFixed(2),
    }));

    const filename = `resumen-trabajadores-${filters.dateRange?.start || 'inicio'}-${filters.dateRange?.end || 'fin'}.csv`;
    downloadCSV(csvData, filename);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Reportes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </button>

        <button
          onClick={exportToJSON}
          className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar JSON
        </button>

        <button
          onClick={exportSummaryReport}
          className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Resumen por Trabajador
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>CSV:</strong> Datos detallados para análisis en Excel</p>
        <p><strong>JSON:</strong> Datos completos con metadatos</p>
        <p><strong>Resumen:</strong> Estadísticas agregadas por trabajador</p>
      </div>
    </div>
  );
}