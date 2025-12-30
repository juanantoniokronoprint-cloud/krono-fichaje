'use client';

import PinAuthGuard from '../components/pin-auth-guard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function DashboardContent() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar si es admin desde la sesión
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('pinAuthSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          setIsAdmin(sessionData.isAdmin === true);
        } catch (error) {
          setIsAdmin(false);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Control de Fichaje
          </h1>
          <p className="text-xl text-gray-600">
            Panel de Administración
          </p>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/workers"
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Gestión de Trabajadores</h2>
                <p className="text-gray-600">Administra trabajadores, crea nuevos empleados y gestiona información</p>
              </div>
            </Link>

            <Link
              href="/reports"
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reportes y Análisis</h2>
                <p className="text-gray-600">Visualiza estadísticas, reportes detallados y análisis de tiempo</p>
              </div>
            </Link>

            <Link
              href="/time-tracking"
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Control de Tiempo</h2>
                <p className="text-gray-600">Supervisa entradas y salidas en tiempo real</p>
              </div>
            </Link>
          </div>
        )}

        {!isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg text-gray-600 mb-4">
              Accede a las secciones administrativas desde el menú superior
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/time-tracking"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Control de Tiempo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PinAuthGuard>
      <DashboardContent />
    </PinAuthGuard>
  );
}
