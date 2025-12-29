'use client';

import { Worker, TimeEntry } from '../types';
import { WorkerStorage, TimeEntryStorage } from '../lib/storage';
import { formatCurrency } from '../lib/utils';
import { useState, useEffect } from 'react';

interface DashboardStatsProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
}

export default function DashboardStats({ workers, timeEntries }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    todayTotalHours: 0,
    todayOvertimeHours: 0,
    averageHoursPerWorker: 0,
    totalPayrollToday: 0,
    onBreakWorkers: 0,
    departmentsActive: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [workers, timeEntries]);

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Active workers (currently working)
    const activeEntries = timeEntries.filter(entry => !entry.clockOut);
    const activeWorkers = activeEntries.length;

    // Workers on break
    const onBreakWorkers = activeEntries.filter(entry => entry.breakStart && !entry.breakEnd).length;

    // Today's time entries
    const todayEntries = timeEntries.filter(entry => {
      const entryDate = entry.clockIn.split('T')[0];
      return entryDate === today;
    });

    // Calculate total hours for today
    const todayTotalHours = todayEntries.reduce((total, entry) => {
      if (entry.totalHours) {
        return total + entry.totalHours;
      }
      return total;
    }, 0);

    // Calculate overtime hours for today
    const todayOvertimeHours = todayEntries.reduce((total, entry) => {
      if (entry.overtime) {
        return total + entry.overtime;
      }
      return total;
    }, 0);

    // Average hours per active worker
    const averageHoursPerWorker = activeWorkers > 0 ? todayTotalHours / activeWorkers : 0;

    // Calculate total payroll for today
    const totalPayrollToday = todayEntries.reduce((total, entry) => {
      if (entry.totalHours && entry.workerId) {
        const worker = workers.find(w => w.id === entry.workerId);
        if (worker) {
          const regularHours = Math.min(entry.totalHours, 8); // First 8 hours at regular rate
          const overtimeHours = Math.max(0, entry.totalHours - 8);
          return total + (regularHours * worker.hourlyRate) + (overtimeHours * worker.hourlyRate * 1.5);
        }
      }
      return total;
    }, 0);

    // Active departments
    const activeDepartments = new Set(
      activeEntries
        .map(entry => {
          const worker = workers.find(w => w.id === entry.workerId);
          return worker?.department;
        })
        .filter(Boolean)
    );

    setStats({
      totalWorkers: workers.length,
      activeWorkers,
      todayTotalHours,
      todayOvertimeHours,
      averageHoursPerWorker,
      totalPayrollToday,
      onBreakWorkers,
      departmentsActive: activeDepartments.size,
    });
  };

  const statItems = [
    {
      title: 'Trabajadores Activos',
      value: stats.activeWorkers,
      subtitle: `de ${stats.totalWorkers} total`,
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'green',
    },
    {
      title: 'Horas Trabajadas Hoy',
      value: `${stats.todayTotalHours.toFixed(1)}h`,
      subtitle: `${stats.todayOvertimeHours.toFixed(1)}h extras`,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      title: 'Nómina de Hoy',
      value: formatCurrency(stats.totalPayrollToday),
      subtitle: `Promedio: ${formatCurrency(stats.totalPayrollToday / (stats.activeWorkers || 1))}`,
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'purple',
    },
    {
      title: 'En Descanso',
      value: stats.onBreakWorkers,
      subtitle: `${stats.departmentsActive} departamentos`,
      icon: (
        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      color: 'yellow',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-50 border-green-200',
      blue: 'bg-blue-50 border-blue-200',
      purple: 'bg-purple-50 border-purple-200',
      yellow: 'bg-yellow-50 border-yellow-200',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`bg-white overflow-hidden shadow rounded-lg border ${getColorClasses(item.color)}`}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.title}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </dd>
                  <dd className="text-sm text-gray-600 truncate">
                    {item.subtitle}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}