'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { WorkerStorage, SettingsStorage } from '../lib/api-storage';
import { Worker } from '../types';

interface PinAuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
  onAuthenticated?: (worker: Worker | 'admin') => void;
}

export default function PinAuthGuard({ 
  children, 
  adminOnly = false,
  onAuthenticated 
}: PinAuthGuardProps) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticatedWorker, setAuthenticatedWorker] = useState<Worker | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [adminPin, setAdminPin] = useState('123456');

  useEffect(() => {
    // Solo verificar sesión si estamos en el cliente
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Cargar PIN de administrador y trabajadores
    const loadInitialData = async () => {
      try {
        const [settings, allWorkers] = await Promise.all([
          SettingsStorage.getAll(),
          WorkerStorage.getAll()
        ]);
        
        if (settings.admin_pin) {
          setAdminPin(settings.admin_pin);
        }
        
        setWorkers(allWorkers.filter(w => w.isActive));

        // Verificar si ya hay una sesión activa en localStorage
        const session = localStorage.getItem('pinAuthSession');
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            // Sesión válida por 8 horas
            if (now - sessionData.timestamp < 8 * 60 * 60 * 1000) {
              setIsAuthenticated(true);
              setIsAdmin(sessionData.isAdmin);
              if (sessionData.worker) {
                // Actualizar los datos del trabajador con los más recientes de la BD
                const currentWorker = allWorkers.find(w => w.id === sessionData.worker.id);
                setAuthenticatedWorker(currentWorker || sessionData.worker);
              }
              onAuthenticated?.(sessionData.isAdmin ? 'admin' : sessionData.worker);
            }
          } catch (error) {
            localStorage.removeItem('pinAuthSession');
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [onAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();
    if (!trimmedPin) return;

    setIsLoading(true);
    setMessage('');

    // Verificar PIN de administrador primero
    if (trimmedPin === adminPin) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setAuthenticatedWorker(null);
      setPin('');
      setMessage('Acceso administrador concedido');
      
          // Guardar sesión solo si estamos en el cliente
          if (typeof window !== 'undefined') {
            localStorage.setItem('pinAuthSession', JSON.stringify({
              isAdmin: true,
              timestamp: Date.now(),
            }));
          }
      
      onAuthenticated?.('admin');
    } else {
      // Buscar trabajador por PIN
      const worker = workers.find(w => {
        // Match by employeeNumber if it exists (exact match)
        if (w.employeeNumber && w.employeeNumber.toString().trim() === trimmedPin) {
          return true;
        }
        // Match by last 6 characters of id (for workers without employeeNumber)
        if (w.id.slice(-6) === trimmedPin) {
          return true;
        }
        // Try matching employeeNumber without leading zeros
        if (w.employeeNumber) {
          const empNum = w.employeeNumber.toString().trim();
          const pinWithoutZeros = trimmedPin.replace(/^0+/, '');
          if (empNum.replace(/^0+/, '') === pinWithoutZeros) {
            return true;
          }
        }
        return false;
      });

      if (worker) {
        if (adminOnly) {
          setMessage('Solo administradores pueden acceder a esta sección');
          setPin('');
        } else {
          setIsAuthenticated(true);
          setIsAdmin(false);
          setAuthenticatedWorker(worker);
          setPin('');
          setMessage(`¡Bienvenido ${worker.name}!`);
          
          // Guardar sesión solo si estamos en el cliente
          if (typeof window !== 'undefined') {
            localStorage.setItem('pinAuthSession', JSON.stringify({
              isAdmin: false,
              worker: worker,
              timestamp: Date.now(),
            }));
          }
          
          onAuthenticated?.(worker);
        }
      } else {
        setMessage('PIN incorrecto. Por favor intenta de nuevo.');
        setPin('');
      }
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setAuthenticatedWorker(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pinAuthSession');
    }
    setPin('');
    setMessage('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {adminOnly ? 'Acceso Administrador' : 'Sistema de Fichaje'}
            </h1>
            <p className="text-gray-600">
              {adminOnly 
                ? 'Ingresa el PIN de administrador para continuar' 
                : 'Ingresa tu PIN para acceder'}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 text-center text-2xl font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••"
                autoFocus
                maxLength={20}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                message.includes('Bienvenido') || message.includes('concedido')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>

          {/* PIN Pad numérico */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPin((prev) => prev + num)}
                className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-colors"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => setPin((prev) => prev + '0')}
              className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((prev) => prev.slice(0, -1))}
              className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-colors"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Clonar hijos y pasarles la información de autenticación si son componentes funcionales
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { 
        auth: { isAdmin, worker: authenticatedWorker } 
      });
    }
    return child;
  });

  return (
    <div>
      {/* Barra de navegación con logout y links */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-6">
              <a href="/" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                {isAdmin ? 'Administrador' : authenticatedWorker?.name || 'Sistema'}
              </a>
              {isAdmin && (
                <>
                  <a href="/workers" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    Trabajadores
                  </a>
                  <a href="/reports" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    Reportes
                  </a>
                  <a href="/time-tracking" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    Control de Tiempo
                  </a>
                  <a href="/settings" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                    Configuración
                  </a>
                </>
              )}
              {!isAdmin && (
                <a href="/time-tracking" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
                  Control de Tiempo
                </a>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      {childrenWithProps}
    </div>
  );
}

