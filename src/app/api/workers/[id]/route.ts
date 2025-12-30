/**
 * Worker API Routes (Individual)
 * Handles operations for a single worker
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { validateWorker } from '@/lib/validators';
import { ErrorHandler, ErrorType, ErrorSeverity, ValidationError } from '@/lib/error-handler';
import { Worker } from '@/types';

// Helper function to map database row to Worker
function mapRowToWorker(row: any): Worker {
  return {
    id: row.id,
    employeeNumber: row.employee_number || undefined,
    name: row.name,
    email: row.email,
    position: row.position,
    department: row.department,
    managerId: row.manager_id || undefined,
    skills: row.skills ? JSON.parse(row.skills) : undefined,
    employmentType: row.employment_type,
    location: row.location || undefined,
    costCenter: row.cost_center || undefined,
    hireDate: row.hire_date ? new Date(row.hire_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    terminationDate: row.termination_date ? new Date(row.termination_date).toISOString().split('T')[0] : undefined,
    hourlyRate: parseFloat(row.hourly_rate) || 0,
    overtimeRate: row.overtime_rate ? parseFloat(row.overtime_rate) : undefined,
    isActive: Boolean(row.is_active),
  };
}

// Helper function to map Worker to database row
function mapWorkerToRow(worker: Partial<Worker>): any {
  return {
    id: worker.id,
    employee_number: worker.employeeNumber || null,
    name: worker.name,
    email: worker.email,
    position: worker.position,
    department: worker.department,
    manager_id: worker.managerId || null,
    skills: worker.skills ? JSON.stringify(worker.skills) : null,
    employment_type: worker.employmentType || 'full-time',
    location: worker.location || null,
    cost_center: worker.costCenter || null,
    hire_date: worker.hireDate ? new Date(worker.hireDate).toISOString().slice(0, 10) : null,
    termination_date: worker.terminationDate ? new Date(worker.terminationDate).toISOString().slice(0, 10) : null,
    hourly_rate: worker.hourlyRate || 0,
    overtime_rate: worker.overtimeRate || null,
    is_active: worker.isActive !== undefined ? worker.isActive : true,
  };
}

// GET /api/workers/[id] - Get worker by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const row = await queryOne('SELECT * FROM workers WHERE id = ?', [id]);

    if (!row) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      );
    }

    const worker = mapRowToWorker(row);
    return NextResponse.json(worker);
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_worker', workerId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// PUT /api/workers/[id] - Update worker
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Get existing worker
    const existingRow = await queryOne('SELECT * FROM workers WHERE id = ?', [id]);
    if (!existingRow) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      );
    }

    const existingWorker = mapRowToWorker(existingRow);
    const updatedWorker: Worker = {
      ...existingWorker,
      ...body,
      id, // Ensure ID doesn't change
    };

    // Validate updated worker
    const validation = validateWorker(updatedWorker, true);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const row = mapWorkerToRow(updatedWorker);

    const sql = `
      UPDATE workers SET
        employee_number = ?, name = ?, email = ?, position = ?, department = ?,
        manager_id = ?, skills = ?, employment_type = ?, location = ?, cost_center = ?,
        hire_date = ?, termination_date = ?, hourly_rate = ?, overtime_rate = ?, is_active = ?
      WHERE id = ?
    `;

    const affectedRows = await execute(sql, [
      row.employee_number,
      row.name,
      row.email,
      row.position,
      row.department,
      row.manager_id,
      row.skills,
      row.employment_type,
      row.location,
      row.cost_center,
      row.hire_date,
      row.termination_date,
      row.hourly_rate,
      row.overtime_rate,
      row.is_active,
      id,
    ]);

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar el trabajador' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedWorker);
  } catch (error) {
    if (error instanceof ValidationError) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { operation: 'update_worker', workerId: params.id }
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
      { operation: 'update_worker', workerId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/workers/[id] - Delete worker
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const affectedRows = await execute('DELETE FROM workers WHERE id = ?', [id]);

    if (affectedRows === 0) {
      return NextResponse.json(
        { error: 'Trabajador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'delete_worker', workerId: params.id }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

