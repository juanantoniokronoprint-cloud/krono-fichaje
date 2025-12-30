/**
 * Stats API Routes
 * Handles statistics and analytics endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { DashboardData, TimeEntry } from '@/types';

// GET /api/stats/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';

    if (type === 'dashboard') {
      // Get total workers
      const totalWorkersResult = await query('SELECT COUNT(*) as count FROM workers');
      const totalWorkers = totalWorkersResult[0]?.count || 0;

      // Get active workers
      const activeWorkersResult = await query('SELECT COUNT(*) as count FROM workers WHERE is_active = ?', [true]);
      const activeWorkers = activeWorkersResult[0]?.count || 0;

      // Get today's date range
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get today's total hours
      const todayHoursResult = await query(`
        SELECT COALESCE(SUM(total_hours), 0) as total_hours
        FROM time_entries
        WHERE DATE(clock_in) = ?
      `, [today]);
      const todayTotalHours = parseFloat(todayHoursResult[0]?.total_hours || '0');

      // Get today's overtime hours
      const todayOvertimeResult = await query(`
        SELECT COALESCE(SUM(overtime), 0) as overtime_hours
        FROM time_entries
        WHERE DATE(clock_in) = ?
      `, [today]);
      const todayOvertimeHours = parseFloat(todayOvertimeResult[0]?.overtime_hours || '0');

      // Get recent entries (last 10)
      const recentEntriesResult = await query(`
        SELECT te.*, w.name as worker_name
        FROM time_entries te
        LEFT JOIN workers w ON te.worker_id = w.id
        ORDER BY te.clock_in DESC
        LIMIT 10
      `);

      const recentEntries: TimeEntry[] = recentEntriesResult.map((row: any) => ({
        id: row.id,
        workerId: row.worker_id,
        projectId: row.project_id || undefined,
        taskId: row.task_id || undefined,
        clockIn: new Date(row.clock_in).toISOString(),
        clockOut: row.clock_out ? new Date(row.clock_out).toISOString() : undefined,
        breakStart: row.break_start ? new Date(row.break_start).toISOString() : undefined,
        breakEnd: row.break_end ? new Date(row.break_end).toISOString() : undefined,
        location: {
          latitude: 0,
          longitude: 0,
          address: '',
        },
        ipAddress: row.ip_address || undefined,
        deviceId: row.device_id || undefined,
        totalHours: row.total_hours ? parseFloat(row.total_hours) : undefined,
        overtime: row.overtime ? parseFloat(row.overtime) : undefined,
        doubleTime: row.double_time ? parseFloat(row.double_time) : undefined,
        holidayHours: row.holiday_hours ? parseFloat(row.holiday_hours) : undefined,
        sickHours: row.sick_hours ? parseFloat(row.sick_hours) : undefined,
        remoteWork: Boolean(row.remote_work),
        approvedBy: row.approved_by || undefined,
        approvalDate: row.approval_date ? new Date(row.approval_date).toISOString() : undefined,
        approvalStatus: row.approval_status || 'pending',
        notes: row.notes || undefined,
        tags: row.tags && row.tags !== 'null' && row.tags !== null ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : undefined,
        billable: row.billable ? Boolean(row.billable) : undefined,
        hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
      }));

      const dashboardData: DashboardData = {
        activeWorkers,
        todayTotalHours,
        todayOvertimeHours,
        totalWorkers,
        recentEntries,
        currentTime: new Date().toISOString(),
      };

      return NextResponse.json(dashboardData);
    }

    return NextResponse.json({ error: 'Tipo de estadística no válido' }, { status: 400 });
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_stats' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

