/**
 * Worker Stats API Routes
 * Handles statistics for individual workers
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { WorkerStats } from '@/types';

// GET /api/stats/worker/[id] - Get statistics for a specific worker
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Verify worker exists
    const worker = await queryOne('SELECT id, name FROM workers WHERE id = ?', [id]);
    if (!worker) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      );
    }

    // Get total hours
    const totalHoursResult = await query(`
      SELECT COALESCE(SUM(total_hours), 0) as total_hours
      FROM time_entries
      WHERE worker_id = ?
    `, [id]);
    const totalHours = parseFloat(totalHoursResult[0]?.total_hours || '0');

    // Get overtime hours
    const overtimeResult = await query(`
      SELECT COALESCE(SUM(overtime), 0) as overtime_hours
      FROM time_entries
      WHERE worker_id = ?
    `, [id]);
    const overtimeHours = parseFloat(overtimeResult[0]?.overtime_hours || '0');

    // Get number of days worked
    const daysWorkedResult = await query(`
      SELECT COUNT(DISTINCT DATE(clock_in)) as days_worked
      FROM time_entries
      WHERE worker_id = ?
    `, [id]);
    const daysWorked = parseInt(daysWorkedResult[0]?.days_worked || '0', 10);

    // Calculate average daily hours
    const averageDailyHours = daysWorked > 0 ? totalHours / daysWorked : 0;

    // Get last clock in
    const lastClockInResult = await query(`
      SELECT clock_in
      FROM time_entries
      WHERE worker_id = ? AND clock_in IS NOT NULL
      ORDER BY clock_in DESC
      LIMIT 1
    `, [id]);
    const lastClockIn = lastClockInResult[0]?.clock_in 
      ? new Date(lastClockInResult[0].clock_in).toISOString() 
      : undefined;

    // Get last clock out
    const lastClockOutResult = await query(`
      SELECT clock_out
      FROM time_entries
      WHERE worker_id = ? AND clock_out IS NOT NULL
      ORDER BY clock_out DESC
      LIMIT 1
    `, [id]);
    const lastClockOut = lastClockOutResult[0]?.clock_out
      ? new Date(lastClockOutResult[0].clock_out).toISOString()
      : undefined;

    const stats: WorkerStats = {
      workerId: id,
      workerName: worker.name as string,
      totalHours,
      overtimeHours,
      averageDailyHours,
      daysWorked,
      lastClockIn,
      lastClockOut,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const params = await context.params;
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_worker_stats', workerId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

