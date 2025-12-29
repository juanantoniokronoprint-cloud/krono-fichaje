/**
 * Workers API Routes
 * Handles CRUD operations for workers
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, insert, execute } from '@/lib/db';
import { validateWorker } from '@/lib/validators';
import { ErrorHandler, ErrorType, ErrorSeverity, ValidationError } from '@/lib/error-handler';
import { Worker } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

// GET /api/workers - Get all workers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let sql = 'SELECT * FROM workers';
    const params: any[] = [];

    if (activeOnly) {
      sql += ' WHERE is_active = ?';
      params.push(true);
    }

    sql += ' ORDER BY name ASC';

    const rows = await query(sql, params);
    const workers = rows.map(mapRowToWorker);

    return NextResponse.json(workers);
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_workers' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// POST /api/workers - Create a new worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate ID if not provided
    const id = body.id || uuidv4();

    // Generate employee number if not provided
    let employeeNumber = body.employeeNumber;
    if (!employeeNumber) {
      const existingWorkers = await query('SELECT employee_number FROM workers WHERE employee_number IS NOT NULL ORDER BY CAST(employee_number AS UNSIGNED) DESC LIMIT 1');
      const maxNumber = existingWorkers.length > 0 && existingWorkers[0].employee_number 
        ? parseInt(existingWorkers[0].employee_number as string) 
        : 0;
      employeeNumber = (maxNumber + 1).toString().padStart(6, '0');
    }

    const worker: Worker = {
      id,
      employeeNumber,
      name: body.name,
      email: body.email,
      position: body.position,
      department: body.department,
      managerId: body.managerId,
      skills: body.skills,
      employmentType: body.employmentType || 'full-time',
      location: body.location,
      costCenter: body.costCenter,
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      terminationDate: body.terminationDate,
      hourlyRate: parseFloat(body.hourlyRate) || 0,
      overtimeRate: body.overtimeRate ? parseFloat(body.overtimeRate) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    // Validate worker
    const validation = validateWorker(worker, false);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const row = mapWorkerToRow(worker);

    const sql = `
      INSERT INTO workers (
        id, employee_number, name, email, position, department, manager_id,
        skills, employment_type, location, cost_center, hire_date, termination_date,
        hourly_rate, overtime_rate, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await insert(sql, [
      row.id,
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
    ]);

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      const appError = ErrorHandler.handleError(
        error,
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { operation: 'create_worker' }
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
      { operation: 'create_worker' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

