'use client';

import { Worker, FilterOptions } from '../types';
import { useState } from 'react';

interface ReportFiltersProps {
  workers: Worker[];
  onFilterChange: (filters: FilterOptions) => void;
}

export default function ReportFilters({ workers, onFilterChange }: ReportFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    workerId: '',
    department: '',
    status: undefined,
  });

  const departments = Array.from(new Set(workers.map(w => w.department))).sort();

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...filters.dateRange!,
      [type]: value,
    };
    handleFilterChange('dateRange', newDateRange);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      workerId: '',
      department: '',
      status: undefined,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.workerId || filters.department || filters.status !== undefined;

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtros de Reporte</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range Start */}
        <div>
          <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            id="dateStart"
            value={filters.dateRange?.start || ''}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range End */}
        <div>
          <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha fin
          </label>
          <input
            type="date"
            id="dateEnd"
            value={filters.dateRange?.end || ''}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Worker Filter */}
        <div>
          <label htmlFor="workerId" className="block text-sm font-medium text-gray-700 mb-1">
            Trabajador
          </label>
          <select
            id="workerId"
            value={filters.workerId || ''}
            onChange={(e) => handleFilterChange('workerId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los trabajadores</option>
            {workers
              .filter(w => w.isActive)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <select
            id="department"
            value={filters.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="clocked-in">Trabajando</option>
            <option value="on-break">En pausa</option>
            <option value="clocked-out">Fuera de horario</option>
          </select>
        </div>
      </div>

      {/* Quick Date Ranges */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Rangos rápidos:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              handleFilterChange('dateRange', { start: today, end: today });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              handleFilterChange('dateRange', { start: yesterdayStr, end: yesterdayStr });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Ayer
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay() + 1);
              const endOfWeek = new Date(today);
              endOfWeek.setDate(today.getDate() - today.getDay() + 7);
              handleFilterChange('dateRange', {
                start: startOfWeek.toISOString().split('T')[0],
                end: endOfWeek.toISOString().split('T')[0],
              });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Esta semana
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              handleFilterChange('dateRange', {
                start: startOfMonth.toISOString().split('T')[0],
                end: endOfMonth.toISOString().split('T')[0],
              });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Este mes
          </button>
        </div>
      </div>
    </div>
  );
}