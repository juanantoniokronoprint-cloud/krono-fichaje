'use client';

import Link from 'next/link';
import AppRouter from '../components/app-router';

export default function Home() {
  return (
    <div>
      {/* Quick access banner for admin/workers management */}
      <div className="bg-blue-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <span>💡 Acceso rápido:</span>
          <div className="flex gap-4">
            <Link href="/workers" className="hover:underline font-medium">
              Gestión de Trabajadores
            </Link>
            <Link href="/time-tracking" className="hover:underline font-medium">
              Control de Tiempo
            </Link>
            <Link href="/reports" className="hover:underline font-medium">
              Reportes
            </Link>
          </div>
        </div>
      </div>
      <AppRouter />
    </div>
  );
}
