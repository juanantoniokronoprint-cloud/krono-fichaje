/**
 * Validation utilities for robust data validation
 */

import { Worker, TimeEntry } from '../types';
import { validateEmail } from './utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidation {
  field: string;
  message: string;
}

/**
 * Validate worker data
 */
export function validateWorker(worker: Partial<Worker>, isUpdate: boolean = false): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!worker.name || typeof worker.name !== 'string' || worker.name.trim().length === 0) {
    errors.push('El nombre es obligatorio');
  } else if (worker.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  } else if (worker.name.trim().length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  // Email validation
  if (!worker.email || typeof worker.email !== 'string' || worker.email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio');
  } else if (!validateEmail(worker.email.trim())) {
    errors.push('El formato del correo electrónico no es válido');
  }

  // Position validation
  if (!worker.position || typeof worker.position !== 'string' || worker.position.trim().length === 0) {
    errors.push('El puesto es obligatorio');
  } else if (worker.position.trim().length > 100) {
    errors.push('El puesto no puede exceder 100 caracteres');
  }

  // Department validation
  if (!worker.department || typeof worker.department !== 'string' || worker.department.trim().length === 0) {
    errors.push('El departamento es obligatorio');
  } else if (worker.department.trim().length > 100) {
    errors.push('El departamento no puede exceder 100 caracteres');
  }

  // Hire date validation
  if (!worker.hireDate) {
    errors.push('La fecha de contratación es obligatoria');
  } else {
    const hireDate = new Date(worker.hireDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(hireDate.getTime())) {
      errors.push('La fecha de contratación no es válida');
    } else if (hireDate > today) {
      errors.push('La fecha de contratación no puede ser futura');
    }
  }

  // Hourly rate validation
  if (worker.hourlyRate === undefined || worker.hourlyRate === null) {
    errors.push('El salario por hora es obligatorio');
  } else {
    const rate = typeof worker.hourlyRate === 'string' ? parseFloat(worker.hourlyRate) : worker.hourlyRate;
    if (isNaN(rate) || rate < 0) {
      errors.push('El salario por hora debe ser un número positivo');
    } else if (rate > 10000) {
      errors.push('El salario por hora parece ser demasiado alto. Por favor verifica.');
    }
  }

  // Overtime rate validation (optional)
  if (worker.overtimeRate !== undefined && worker.overtimeRate !== null) {
    const overtimeRate = typeof worker.overtimeRate === 'string' ? parseFloat(worker.overtimeRate) : worker.overtimeRate;
    if (isNaN(overtimeRate) || overtimeRate < 0) {
      errors.push('La tarifa de horas extra debe ser un número positivo');
    }
  }

  // Employee number validation (if provided)
  if (worker.employeeNumber && typeof worker.employeeNumber === 'string') {
    if (worker.employeeNumber.trim().length > 20) {
      errors.push('El número de empleado no puede exceder 20 caracteres');
    }
  }

  // Termination date validation (if provided)
  if (worker.terminationDate) {
    const terminationDate = new Date(worker.terminationDate);
    const hireDate = worker.hireDate ? new Date(worker.hireDate) : null;

    if (isNaN(terminationDate.getTime())) {
      errors.push('La fecha de terminación no es válida');
    } else if (hireDate && terminationDate < hireDate) {
      errors.push('La fecha de terminación no puede ser anterior a la fecha de contratación');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate time entry data
 */
export function validateTimeEntry(entry: Partial<TimeEntry>): ValidationResult {
  const errors: string[] = [];

  // Worker ID validation
  if (!entry.workerId || typeof entry.workerId !== 'string' || entry.workerId.trim().length === 0) {
    errors.push('El ID del trabajador es obligatorio');
  }

  // Clock in validation
  if (!entry.clockIn || typeof entry.clockIn !== 'string') {
    errors.push('La hora de entrada es obligatoria');
  } else {
    const clockIn = new Date(entry.clockIn);
    if (isNaN(clockIn.getTime())) {
      errors.push('La hora de entrada no es válida');
    } else {
      const now = new Date();
      const maxFutureTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes in the future (tolerance)

      if (clockIn > maxFutureTime) {
        errors.push('La hora de entrada no puede ser en el futuro');
      }
    }
  }

  // Clock out validation (if provided)
  if (entry.clockOut) {
    const clockOut = new Date(entry.clockOut);
    const clockIn = entry.clockIn ? new Date(entry.clockIn) : null;

    if (isNaN(clockOut.getTime())) {
      errors.push('La hora de salida no es válida');
    } else if (clockIn && clockOut <= clockIn) {
      errors.push('La hora de salida debe ser posterior a la hora de entrada');
    } else if (clockIn) {
      // Check for unreasonable shift duration (more than 24 hours)
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 24) {
        errors.push('La duración del turno no puede exceder 24 horas');
      }
    }
  }

  // Location validation
  if (!entry.location) {
    errors.push('La ubicación es obligatoria');
  } else {
    if (typeof entry.location.latitude !== 'number' || isNaN(entry.location.latitude)) {
      errors.push('La latitud de la ubicación no es válida');
    } else if (entry.location.latitude < -90 || entry.location.latitude > 90) {
      errors.push('La latitud debe estar entre -90 y 90');
    }

    if (typeof entry.location.longitude !== 'number' || isNaN(entry.location.longitude)) {
      errors.push('La longitud de la ubicación no es válida');
    } else if (entry.location.longitude < -180 || entry.location.longitude > 180) {
      errors.push('La longitud debe estar entre -180 y 180');
    }
  }

  // Break validation
  if (entry.breakStart) {
    const breakStart = new Date(entry.breakStart);
    const clockIn = entry.clockIn ? new Date(entry.clockIn) : null;

    if (isNaN(breakStart.getTime())) {
      errors.push('La hora de inicio del descanso no es válida');
    } else if (clockIn && breakStart < clockIn) {
      errors.push('El descanso no puede comenzar antes de la hora de entrada');
    }
  }

  if (entry.breakEnd) {
    const breakEnd = new Date(entry.breakEnd);
    const breakStart = entry.breakStart ? new Date(entry.breakStart) : null;
    const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;

    if (isNaN(breakEnd.getTime())) {
      errors.push('La hora de fin del descanso no es válida');
    } else if (breakStart && breakEnd <= breakStart) {
      errors.push('El fin del descanso debe ser posterior al inicio');
    } else if (clockOut && breakEnd > clockOut) {
      errors.push('El descanso no puede terminar después de la hora de salida');
    }
  }

  // Total hours validation (if provided)
  if (entry.totalHours !== undefined && entry.totalHours !== null) {
    const totalHours = typeof entry.totalHours === 'string' ? parseFloat(entry.totalHours) : entry.totalHours;
    if (isNaN(totalHours) || totalHours < 0) {
      errors.push('Las horas totales deben ser un número positivo');
    } else if (totalHours > 24) {
      errors.push('Las horas totales no pueden exceder 24 horas');
    }
  }

  // Overtime validation (if provided)
  if (entry.overtime !== undefined && entry.overtime !== null) {
    const overtime = typeof entry.overtime === 'string' ? parseFloat(entry.overtime) : entry.overtime;
    if (isNaN(overtime) || overtime < 0) {
      errors.push('Las horas extra deben ser un número positivo');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('El correo electrónico es obligatorio');
  } else if (!validateEmail(email.trim())) {
    errors.push('El formato del correo electrónico no es válido');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push('La fecha de inicio no es válida');
  }

  if (isNaN(end.getTime())) {
    errors.push('La fecha de fin no es válida');
  }

  if (errors.length === 0 && end < start) {
    errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
  }

  // Check for unreasonable date range (more than 1 year)
  if (errors.length === 0) {
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      errors.push('El rango de fechas no puede exceder 1 año');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if worker email is unique
 */
export function validateUniqueEmail(
  email: string,
  existingWorkers: Worker[],
  excludeWorkerId?: string
): ValidationResult {
  const errors: string[] = [];

  const emailResult = validateEmailFormat(email);
  if (!emailResult.isValid) {
    return emailResult;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = existingWorkers.find(
    (worker) => worker.email.toLowerCase() === normalizedEmail && worker.id !== excludeWorkerId
  );

  if (duplicate) {
    errors.push('Ya existe un trabajador con este correo electrónico');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate PIN format (4-6 digits)
 */
export function validatePIN(pin: string): ValidationResult {
  const errors: string[] = [];

  if (!pin || typeof pin !== 'string' || pin.trim().length === 0) {
    errors.push('El PIN es obligatorio');
  } else {
    const pinValue = pin.trim();
    if (!/^\d{4,6}$/.test(pinValue)) {
      errors.push('El PIN debe tener entre 4 y 6 dígitos numéricos');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

