'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/storage';
import { AuthService, User } from '../lib/auth';
import WorkerPinLogin from './worker-pin-login';
import AdminManagement from './admin-management';
import EnhancedDashboard from './enhanced-dashboard';

export default function AppRouter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'clock' | 'admin' | 'dashboard'>('clock');

  useEffect(() => {
    // Check if user is already logged in
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setActiveView(user.role === 'worker' ? 'clock' : 'dashboard');
    }
    setIsLoading(false);

    // Subscribe to auth changes
    const unsubscribe = AuthService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        setActiveView(user.role === 'worker' ? 'clock' : 'dashboard');
      }
    });

    // Load data
    loadData();

    return unsubscribe;
  }, []);

  const loadData = () => {
    const loadedWorkers = WorkerStorage.getAll();
    const loadedEntries = TimeEntryStorage.getAll();
    setWorkers(loadedWorkers);
    setTimeEntries(loadedEntries);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView(user.role === 'worker' ? 'clock' : 'dashboard');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setActiveView('clock');
  };

  const handleTimeEntryChange = () => {
    // Refresh data when time entries change
    loadData();
  };

  const handleWorkersChange = () => {
    // Refresh workers data
    loadData();
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show PIN login for workers or admin management for admins
  if (!currentUser) {
    return <WorkerPinLogin onClockIn={handleTimeEntryChange} onClockOut={handleTimeEntryChange} />;
  }

  // Admin Management Interface
  if (activeView === 'admin') {
    return (
      <AdminManagement
        workers={workers}
        timeEntries={timeEntries}
        onWorkersChange={handleWorkersChange}
      />
    );
  }

  // Worker Interface - PIN-based clock in/out
  if (currentUser.role === 'worker') {
    return (
      <WorkerPinLogin
        onClockIn={handleTimeEntryChange}
        onClockOut={handleTimeEntryChange}
      />
    );
  }

  // Admin/Manager Interface - Full analytics dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Control de Fichaje
              </h1>
              <p className="text-sm text-gray-600">
                Panel de Administración - {currentUser.role === 'admin' ? 'Administrador' : 'Manager'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveView('admin')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Gestión Administrativa
              </button>
              <span className="text-sm text-gray-700">
                Bienvenido, {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <EnhancedDashboard workers={workers} timeEntries={timeEntries} />
      </main>
    </div>
  );
}