/**
 * Time Entries API Routes
 * Handles CRUD operations for time entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, insert, execute } from '@/lib/db';
import { validateTimeEntry } from '@/lib/validators';
import { ErrorHandler, ErrorType, ErrorSeverity, ValidationError } from '@/lib/error-handler';
import { TimeEntry, Location } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

// GET /api/time-entries - Get all time entries (with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let sql = 'SELECT * FROM time_entries WHERE 1=1';
    const params: any[] = [];

    if (workerId) {
      sql += ' AND worker_id = ?';
      params.push(workerId);
    }

    if (startDate) {
      sql += ' AND DATE(clock_in) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND DATE(clock_in) <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY clock_in DESC LIMIT ?';
    params.push(limit);

    const rows = await query(sql, params);
    const entries = rows.map(mapRowToTimeEntry);

    return NextResponse.json(entries);
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_time_entries' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// POST /api/time-entries - Create a new time entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate ID if not provided
    const id = body.id || uuidv4();

    const entry: TimeEntry = {
      id,
      workerId: body.workerId,
      projectId: body.projectId,
      taskId: body.taskId,
      clockIn: body.clockIn || new Date().toISOString(),
      clockOut: body.clockOut,
      breakStart: body.breakStart,
      breakEnd: body.breakEnd,
      location: body.location || { latitude: 0, longitude: 0, address: '' },
      ipAddress: body.ipAddress,
      deviceId: body.deviceId,
      totalHours: body.totalHours,
      overtime: body.overtime,
      doubleTime: body.doubleTime,
      holidayHours: body.holidayHours,
      sickHours: body.sickHours,
      remoteWork: body.remoteWork || false,
      approvedBy: body.approvedBy,
      approvalDate: body.approvalDate,
      approvalStatus: body.approvalStatus || 'pending',
      notes: body.notes,
      tags: body.tags,
      billable: body.billable,
      hourlyRate: body.hourlyRate,
    };

    // Validate entry
    const validation = validateTimeEntry(entry, false);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const row = mapTimeEntryToRow(entry);

    const sql = `
      INSERT INTO time_entries (
        id, worker_id, project_id, task_id, clock_in, clock_out, break_start, break_end,
        location_latitude, location_longitude, location_address, ip_address, device_id,
        total_hours, overtime, double_time, holiday_hours, sick_hours, remote_work,
        approved_by, approval_date, approval_status, notes, tags, billable, hourly_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await insert(sql, [
      row.id,
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
    ]);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { operation: 'create_time_entry' }
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
      { operation: 'create_time_entry' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

