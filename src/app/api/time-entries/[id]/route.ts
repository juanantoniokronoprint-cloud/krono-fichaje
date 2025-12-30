/**
 * Time Entry API Routes (Individual)
 * Handles operations for a single time entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { validateTimeEntry } from '@/lib/validators';
import { ErrorHandler, ErrorType, ErrorSeverity, ValidationError } from '@/lib/error-handler';
import { TimeEntry } from '@/types';

// Helper function to map database row to TimeEntry
function mapRowToTimeEntry(row: any): TimeEntry {
  return {
    id: row.id,
    workerId: row.worker_id,
    projectId: row.project_id || undefined,
    taskId: row.task_id || undefined,
    clockIn: new Date(row.clock_in).toISOString(),
    clockOut: row.clock_out ? new Date(row.clock_out).toISOString() : undefined,
    breakStart: row.break_start ? new Date(row.break_start).toISOString() : undefined,
    breakEnd: row.break_end ? new Date(row.break_end).toISOString() : undefined,
    location: {
      latitude: parseFloat(row.location_latitude) || 0,
      longitude: parseFloat(row.location_longitude) || 0,
      address: row.location_address || '',
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
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    billable: row.billable ? Boolean(row.billable) : undefined,
    hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
  };
}

// Helper function to map TimeEntry to database row
function mapTimeEntryToRow(entry: Partial<TimeEntry>): any {
  return {
    id: entry.id,
    worker_id: entry.workerId,
    project_id: entry.projectId || null,
    task_id: entry.taskId || null,
    clock_in: entry.clockIn ? new Date(entry.clockIn).toISOString().slice(0, 19).replace('T', ' ') : null,
    clock_out: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 19).replace('T', ' ') : null,
    break_start: entry.breakStart ? new Date(entry.breakStart).toISOString().slice(0, 19).replace('T', ' ') : null,
    break_end: entry.breakEnd ? new Date(entry.breakEnd).toISOString().slice(0, 19).replace('T', ' ') : null,
    location_latitude: entry.location?.latitude || null,
    location_longitude: entry.location?.longitude || null,
    location_address: entry.location?.address || null,
    ip_address: entry.ipAddress || null,
    device_id: entry.deviceId || null,
    total_hours: entry.totalHours || null,
    overtime: entry.overtime || null,
    double_time: entry.doubleTime || null,
    holiday_hours: entry.holidayHours || null,
    sick_hours: entry.sickHours || null,
    remote_work: entry.remoteWork || false,
    approved_by: entry.approvedBy || null,
    approval_date: entry.approvalDate ? new Date(entry.approvalDate).toISOString().slice(0, 19).replace('T', ' ') : null,
    approval_status: entry.approvalStatus || 'pending',
    notes: entry.notes || null,
    tags: entry.tags ? JSON.stringify(entry.tags) : null,
    billable: entry.billable || null,
    hourly_rate: entry.hourlyRate || null,
  };
}

// GET /api/time-entries/[id] - Get time entry by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const row = await queryOne('SELECT * FROM time_entries WHERE id = ?', [id]);

    if (!row) {
      return NextResponse.json(
        { error: 'Registro de tiempo no encontrado' },
        { status: 404 }
      );
    }

    const entry = mapRowToTimeEntry(row);
    return NextResponse.json(entry);
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_time_entry', entryId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// PUT /api/time-entries/[id] - Update time entry
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Get existing entry
    const existingRow = await queryOne('SELECT * FROM time_entries WHERE id = ?', [id]);
    if (!existingRow) {
      return NextResponse.json(
        { error: 'Registro de tiempo no encontrado' },
        { status: 404 }
      );
    }

    const existingEntry = mapRowToTimeEntry(existingRow);
    const updatedEntry: TimeEntry = {
      ...existingEntry,
      ...body,
      id, // Ensure ID doesn't change
    };

    // Validate updated entry
    const validation = validateTimeEntry(updatedEntry, true);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const row = mapTimeEntryToRow(updatedEntry);

    const sql = `
      UPDATE time_entries SET
        worker_id = ?, project_id = ?, task_id = ?, clock_in = ?, clock_out = ?,
        break_start = ?, break_end = ?, location_latitude = ?, location_longitude = ?,
        location_address = ?, ip_address = ?, device_id = ?, total_hours = ?,
        overtime = ?, double_time = ?, holiday_hours = ?, sick_hours = ?,
        remote_work = ?, approved_by = ?, approval_date = ?, approval_status = ?,
        notes = ?, tags = ?, billable = ?, hourly_rate = ?
      WHERE id = ?
    `;

    const affectedRows = await execute(sql, [
      row.worker_id,
      row.project_id,
      row.task_id,
      row.clock_in,
      row.clock_out,
      row.break_start,
      row.break_end,
      row.location_latitude,
      row.location_longitude,
      row.location_address,
      row.ip_address,
      row.device_id,
      row.total_hours,
      row.overtime,
      row.double_time,
      row.holiday_hours,
      row.sick_hours,
      row.remote_work,
      row.approved_by,
      row.approval_date,
      row.approval_status,
      row.notes,
      row.tags,
      row.billable,
      row.hourly_rate,
      id,
    ]);

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar el registro de tiempo' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    if (error instanceof ValidationError) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { operation: 'update_time_entry', entryId: params.id }
      );
      return NextResponse.json(
        { error: appError.userMessage },
        { status: 400 }
      );
    }

    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'update_time_entry', entryId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/time-entries/[id] - Delete time entry
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const affectedRows = await execute('DELETE FROM time_entries WHERE id = ?', [id]);

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'Registro de tiempo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'delete_time_entry', entryId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

