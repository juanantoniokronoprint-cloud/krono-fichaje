'use client';

import { Worker, TimeEntry, FilterOptions } from '../types';
import { formatCurrency } from '../lib/utils';
import { formatTime, formatDate } from '../lib/storage';
import { isToday } from '../lib/utils';
import { useState } from 'react';

interface ReportsTableProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
  filters: FilterOptions;
}

export default function ReportsTable({ workers, timeEntries, filters }: ReportsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof TimeEntry>('clockIn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 20;

  const filterAndSortEntries = () => {
    let filtered = timeEntries.filter(entry => {
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

    // Sort entries
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'clockIn' || sortField === 'clockOut' || sortField === 'breakStart' || sortField === 'breakEnd') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredEntries = filterAndSortEntries();
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof TimeEntry) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof TimeEntry) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatusBadge = (entry: TimeEntry) => {
    if (entry.breakStart && !entry.breakEnd) {
      return <span className="px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded-full">En pausa</span>;
    }
    if (!entry.clockOut) {
      return <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">Trabajando</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Finalizado</span>;
  };

  if (filteredEntries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Detalle de Registros
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">No hay registros que coincidan con los filtros seleccionados</p>
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
            Detalle de Registros ({filteredEntries.length} registros)
          </h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('clockIn')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Fecha/Hora Entrada</span>
                    {getSortIcon('clockIn')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('clockOut')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Hora Salida</span>
                    {getSortIcon('clockOut')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trabajador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th 
                  onClick={() => handleSort('totalHours')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Horas</span>
                    {getSortIcon('totalHours')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('overtime')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Extras</span>
                    {getSortIcon('overtime')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.map((entry) => {
                const worker = workers.find(w => w.id === entry.workerId);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className={`font-medium ${isToday(entry.clockIn) ? 'text-blue-600' : ''}`}>
                          {new Date(entry.clockIn).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-gray-500">
                          {formatTime(new Date(entry.clockIn))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.clockOut ? (
                        <div>
                          <div>{formatTime(new Date(entry.clockOut))}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{worker?.name || 'Desconocido'}</div>
                        <div className="text-gray-500">{worker?.position}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker?.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.totalHours ? entry.totalHours.toFixed(1) : '-'}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.overtime && entry.overtime > 0 ? (
                        <span className="text-red-600 font-medium">{entry.overtime.toFixed(1)}h</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {entry.location.address}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {paginatedEntries.map((entry) => {
            const worker = workers.find(w => w.id === entry.workerId);
            return (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{worker?.name}</h4>
                  {getStatusBadge(entry)}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Fecha: {new Date(entry.clockIn).toLocaleDateString('es-ES')}</div>
                  <div>Entrada: {formatTime(new Date(entry.clockIn))}</div>
                  {entry.clockOut && <div>Salida: {formatTime(new Date(entry.clockOut))}</div>}
                  <div>Horas: {entry.totalHours ? entry.totalHours.toFixed(1) : '-'}h</div>
                  {entry.overtime && entry.overtime > 0 && (
                    <div className="text-red-600">Extras: {entry.overtime.toFixed(1)}h</div>
                  )}
                  <div className="text-xs text-gray-500 truncate">{entry.location.address}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredEntries.length)} de {filteredEntries.length} registros
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}