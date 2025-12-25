'use client';

import { Worker } from '../types';
import WorkerCard from './worker-card';
import { useState, useMemo } from 'react';

interface WorkerListProps {
  workers: Worker[];
  onUpdate: () => void;
  onEdit: (worker: Worker) => void;
}

export default function WorkerList({ workers, onUpdate, onEdit }: WorkerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const departments = useMemo(() => {
    const depts = new Set(workers.map(w => w.department));
    return Array.from(depts).sort();
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const matchesSearch = 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !filterDepartment || worker.department === filterDepartment;
      
      const matchesStatus = (() => {
        switch (filterStatus) {
          case 'active':
            return worker.isActive;
          case 'inactive':
            return !worker.isActive;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [workers, searchTerm, filterDepartment, filterStatus]);

  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay trabajadores registrados</h3>
        <p className="text-gray-500">Comienza agregando tu primer trabajador al sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar trabajadores
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o puesto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <select
              id="department"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {filteredWorkers.length} de {workers.length} trabajadores
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDepartment('');
                setFilterStatus('');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron trabajadores con los filtros aplicados.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('');
              setFilterStatus('');
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map(worker => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onUpdate={onUpdate}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}