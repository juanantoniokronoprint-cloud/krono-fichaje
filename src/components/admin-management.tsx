'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/storage';

// Helper function to ensure skills array exists
const ensureSkills = (skills?: string[]): string[] => {
  return skills || [];
};

interface AdminManagementProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
  onWorkersChange?: () => void;
}

export default function AdminManagement({ workers, timeEntries, onWorkersChange }: AdminManagementProps) {
  const [activeTab, setActiveTab] = useState<'workers' | 'entries' | 'settings'>('workers');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newWorker, setNewWorker] = useState<Omit<Worker, 'id' | 'isActive'>>({
    employeeNumber: '',
    name: '',
    email: '',
    position: '',
    department: '',
    managerId: '',
    skills: [],
    employmentType: 'full-time',
    location: '',
    costCenter: '',
    hireDate: new Date().toISOString().split('T')[0],
    hourlyRate: 0,
    overtimeRate: 0
  });

  const [pinAdmin, setPinAdmin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Admin PIN validation
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Admin PIN entered:', pinAdmin); // Debug log
    // For demo - admin PIN is '123456'
    if (pinAdmin === '123456') {
      setIsAdminAuthenticated(true);
      setMessage('Acceso administrador concedido');
      console.log('Admin authenticated successfully'); // Debug log
    } else {
      setMessage('PIN administrador incorrecto');
      console.log('Admin PIN incorrect'); // Debug log
    }
  };

  const [message, setMessage] = useState('');

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedWorker) {
      WorkerStorage.update(selectedWorker.id, newWorker);
      setMessage('Trabajador actualizado exitosamente');
    } else {
      WorkerStorage.create({ ...newWorker, isActive: true });
      setMessage('Trabajador creado exitosamente');
    }
    setNewWorker({
      employeeNumber: '',
      name: '',
      email: '',
      position: '',
      department: '',
      managerId: '',
      skills: [],
      employmentType: 'full-time',
      location: '',
      costCenter: '',
      hireDate: new Date().toISOString().split('T')[0],
      hourlyRate: 0,
      overtimeRate: 0
    });
    setIsEditing(false);
    setSelectedWorker(null);
    onWorkersChange?.();
  };

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setNewWorker({
      employeeNumber: worker.employeeNumber || '',
      name: worker.name,
      email: worker.email,
      position: worker.position,
      department: worker.department,
      managerId: worker.managerId || '',
      skills: worker.skills || [],
      employmentType: worker.employmentType,
      location: worker.location || '',
      costCenter: worker.costCenter || '',
      hireDate: worker.hireDate.split('T')[0],
      hourlyRate: worker.hourlyRate,
      overtimeRate: worker.overtimeRate || 0
    });
    setIsEditing(true);
  };

  const handleDeleteWorker = (workerId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este trabajador?')) {
      WorkerStorage.delete(workerId);
      setMessage('Trabajador eliminado exitosamente');
      onWorkersChange?.();
    }
  };

  const handleToggleWorkerStatus = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      WorkerStorage.update(workerId, { isActive: !worker.isActive });
      setMessage(`Trabajador ${worker.isActive ? 'desactivado' : 'activado'} exitosamente`);
      onWorkersChange?.();
    }
  };

  const handleAddSkill = (skill: string) => {
    setNewWorker(prev => ({
      ...prev,
      skills: [...ensureSkills(prev.skills), skill]
    }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setNewWorker(prev => ({
      ...prev,
      skills: ensureSkills(prev.skills).filter(skill => skill !== skillToRemove)
    }));
  };

  // Admin PIN Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Administrador
            </h1>
            <p className="text-gray-600">Ingresa el PIN de administrador</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAdminLogin(e);
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Administrador
              </label>
              <input
                type="password"
                value={pinAdmin}
                onChange={(e) => setPinAdmin(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-gray-900"
                placeholder="••••••"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              ACCEDER
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center ${
              message.includes('incorrecto') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">PIN de demostración:</h3>
            <p className="text-sm text-gray-600">Admin PIN: <strong>123456</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión Administrativa</h1>
            <p className="text-gray-600">Panel de control para administradores</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsAdminAuthenticated(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cerrar Sesión Admin
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'workers', name: 'Trabajadores', icon: '👥' },
            { id: 'entries', name: 'Registros', icon: '📋' },
            { id: 'settings', name: 'Configuración', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worker Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditing ? 'Editar Trabajador' : 'Nuevo Trabajador'}
              </h3>
              
              <form onSubmit={handleWorkerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de Empleado</label>
                  <input
                    type="text"
                    value={newWorker.employeeNumber}
                    onChange={(e) => setNewWorker({...newWorker, employeeNumber: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="EJ: EMP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Puesto</label>
                  <input
                    type="text"
                    value={newWorker.position}
                    onChange={(e) => setNewWorker({...newWorker, position: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Departamento</label>
                  <input
                    type="text"
                    value={newWorker.department}
                    onChange={(e) => setNewWorker({...newWorker, department: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Contrato</label>
                  <select
                    value={newWorker.employmentType}
                    onChange={(e) => setNewWorker({...newWorker, employmentType: e.target.value as any})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="full-time">Tiempo Completo</option>
                    <option value="part-time">Medio Tiempo</option>
                    <option value="contractor">Contratista</option>
                    <option value="intern">Prácticas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Salario por Hora (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newWorker.hourlyRate}
                    onChange={(e) => setNewWorker({...newWorker, hourlyRate: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tasa de Horas Extra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newWorker.overtimeRate}
                    onChange={(e) => setNewWorker({...newWorker, overtimeRate: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Habilidades</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Añadir habilidad"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleAddSkill(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Añadir habilidad"]') as HTMLInputElement;
                        if (input?.value) {
                          handleAddSkill(input.value);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ensureSkills(newWorker.skills).map((skill, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    {isEditing ? 'Actualizar' : 'Crear'} Trabajador
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedWorker(null);
                        setNewWorker({
                          employeeNumber: '',
                          name: '',
                          email: '',
                          position: '',
                          department: '',
                          managerId: '',
                          skills: [],
                          employmentType: 'full-time',
                          location: '',
                          costCenter: '',
                          hireDate: new Date().toISOString().split('T')[0],
                          hourlyRate: 0,
                          overtimeRate: 0
                        });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Workers List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Trabajadores</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workers.map((worker) => (
                        <tr key={worker.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                              <div className="text-sm text-gray-500">{worker.employeeNumber || worker.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{worker.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{worker.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€{worker.hourlyRate}/h</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              worker.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {worker.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditWorker(worker)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleWorkerStatus(worker.id)}
                              className={`hover:text-gray-900 ${
                                worker.isActive ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {worker.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDeleteWorker(worker.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Registros de Tiempo</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.slice(0, 50).map((entry) => {
                    const worker = workers.find(w => w.id === entry.workerId);
                    const hours = entry.clockOut 
                      ? ((new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60))
                      : 0;
                    
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{worker?.name || 'Desconocido'}</div>
                          <div className="text-sm text-gray-500">{worker?.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.clockIn).toLocaleString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.clockOut ? new Date(entry.clockOut).toLocaleString('es-ES') : 'Activo'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.clockOut ? hours.toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.clockOut 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.clockOut ? 'Finalizado' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.location.address}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                <input
                  type="text"
                  defaultValue="Tu Empresa"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Horario Estándar</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                  <input
                    type="time"
                    defaultValue="17:00"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">PIN Administrador</label>
                <input
                  type="password"
                  defaultValue="123456"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600">Total Trabajadores</div>
                  <div className="text-2xl font-bold text-blue-900">{workers.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600">Trabajadores Activos</div>
                  <div className="text-2xl font-bold text-green-900">{workers.filter(w => w.isActive).length}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600">Registros Hoy</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {timeEntries.filter(e => e.clockIn.startsWith(new Date().toISOString().split('T')[0])).length}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600">Registros Activos</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {timeEntries.filter(e => !e.clockOut).length}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Último Backup</div>
                <div className="text-sm font-medium text-gray-900">{new Date().toLocaleString('es-ES')}</div>
                <button className="mt-2 text-sm text-red-600 hover:text-red-800">Realizar Backup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}