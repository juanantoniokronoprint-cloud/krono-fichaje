/**
 * Data Recovery System
 * Provides backup, restore, and corruption detection for localStorage data
 */

import { Worker, TimeEntry } from '../types';
import { ErrorHandler, ErrorType, ErrorSeverity, StorageError } from './error-handler';

const BACKUP_KEYS = {
  WORKERS: 'time-tracking-workers-backup',
  TIME_ENTRIES: 'time-tracking-entries-backup',
  TIMESTAMP: 'time-tracking-backup-timestamp',
};

const STORAGE_KEYS = {
  WORKERS: 'time-tracking-workers',
  TIME_ENTRIES: 'time-tracking-entries',
};

interface BackupData {
  workers: Worker[];
  timeEntries: TimeEntry[];
  timestamp: string;
}

/**
 * Data Recovery Manager
 */
export class DataRecovery {
  /**
   * Create backup of current data
   */
  static createBackup(): boolean {
    try {
      const workersData = localStorage.getItem(STORAGE_KEYS.WORKERS);
      const entriesData = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);

      if (workersData) {
        localStorage.setItem(BACKUP_KEYS.WORKERS, workersData);
      }
      if (entriesData) {
        localStorage.setItem(BACKUP_KEYS.TIME_ENTRIES, entriesData);
      }

      localStorage.setItem(BACKUP_KEYS.TIMESTAMP, new Date().toISOString());
      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'createBackup' }
      );
      return false;
    }
  }

  /**
   * Restore data from backup
   */
  static restoreBackup(): { success: boolean; restoredData?: BackupData } {
    try {
      const workersBackup = localStorage.getItem(BACKUP_KEYS.WORKERS);
      const entriesBackup = localStorage.getItem(BACKUP_KEYS.TIME_ENTRIES);
      const timestamp = localStorage.getItem(BACKUP_KEYS.TIMESTAMP);

      if (!workersBackup && !entriesBackup) {
        return { success: false };
      }

      // Validate backup data
      let workers: Worker[] = [];
      let timeEntries: TimeEntry[] = [];

      if (workersBackup) {
        try {
          workers = JSON.parse(workersBackup);
          if (!Array.isArray(workers)) {
            throw new Error('Invalid workers backup format');
          }
        } catch (error) {
          ErrorHandler.handleError(
            error,
            ErrorType.STORAGE,
            ErrorSeverity.HIGH,
            { operation: 'restoreBackup', dataType: 'workers' }
          );
        }
      }

      if (entriesBackup) {
        try {
          timeEntries = JSON.parse(entriesBackup);
          if (!Array.isArray(timeEntries)) {
            throw new Error('Invalid entries backup format');
          }
        } catch (error) {
          ErrorHandler.handleError(
            error,
            ErrorType.STORAGE,
            ErrorSeverity.HIGH,
            { operation: 'restoreBackup', dataType: 'timeEntries' }
          );
        }
      }

      // Restore data
      if (workers.length > 0) {
        localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
      }
      if (timeEntries.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries));
      }

      return {
        success: true,
        restoredData: {
          workers,
          timeEntries,
          timestamp: timestamp || new Date().toISOString(),
        },
      };
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'restoreBackup' }
      );
      return { success: false };
    }
  }

  /**
   * Validate data schema and detect corruption
   */
  static validateData(data: unknown, dataType: 'workers' | 'timeEntries'): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data) {
      errors.push(`No ${dataType} data found`);
      return { isValid: false, errors };
    }

    if (!Array.isArray(data)) {
      errors.push(`${dataType} data is not an array`);
      return { isValid: false, errors };
    }

    if (dataType === 'workers') {
      return this.validateWorkersSchema(data as unknown[]);
    } else {
      return this.validateTimeEntriesSchema(data as unknown[]);
    }
  }

  /**
   * Validate workers schema
   */
  private static validateWorkersSchema(data: unknown[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = ['id', 'name', 'email', 'position', 'department', 'hireDate', 'hourlyRate', 'isActive'];

    data.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Worker at index ${index} is not an object`);
        return;
      }

      const worker = item as Record<string, unknown>;

      // Check required fields
      for (const field of requiredFields) {
        if (!(field in worker)) {
          errors.push(`Worker at index ${index} is missing required field: ${field}`);
        }
      }

      // Validate field types
      if (worker.id && typeof worker.id !== 'string') {
        errors.push(`Worker at index ${index} has invalid id type`);
      }
      if (worker.name && typeof worker.name !== 'string') {
        errors.push(`Worker at index ${index} has invalid name type`);
      }
      if (worker.email && typeof worker.email !== 'string') {
        errors.push(`Worker at index ${index} has invalid email type`);
      }
      if (worker.hourlyRate !== undefined && typeof worker.hourlyRate !== 'number') {
        errors.push(`Worker at index ${index} has invalid hourlyRate type`);
      }
      if (worker.isActive !== undefined && typeof worker.isActive !== 'boolean') {
        errors.push(`Worker at index ${index} has invalid isActive type`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate time entries schema
   */
  private static validateTimeEntriesSchema(data: unknown[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = ['id', 'workerId', 'clockIn', 'location'];

    data.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`TimeEntry at index ${index} is not an object`);
        return;
      }

      const entry = item as Record<string, unknown>;

      // Check required fields
      for (const field of requiredFields) {
        if (!(field in entry)) {
          errors.push(`TimeEntry at index ${index} is missing required field: ${field}`);
        }
      }

      // Validate field types
      if (entry.id && typeof entry.id !== 'string') {
        errors.push(`TimeEntry at index ${index} has invalid id type`);
      }
      if (entry.workerId && typeof entry.workerId !== 'string') {
        errors.push(`TimeEntry at index ${index} has invalid workerId type`);
      }
      if (entry.clockIn && typeof entry.clockIn !== 'string') {
        errors.push(`TimeEntry at index ${index} has invalid clockIn type`);
      }
      if (entry.location && (typeof entry.location !== 'object' || entry.location === null)) {
        errors.push(`TimeEntry at index ${index} has invalid location type`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if data is corrupted and attempt recovery
   */
  static checkAndRecover(): {
    corrupted: boolean;
    recovered: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Check workers data
      const workersData = localStorage.getItem(STORAGE_KEYS.WORKERS);
      if (workersData) {
        try {
          const workers = JSON.parse(workersData);
          const validation = this.validateData(workers, 'workers');
          if (!validation.isValid) {
            errors.push(...validation.errors.map((e) => `Workers: ${e}`));
          }
        } catch (parseError) {
          errors.push('Workers data is corrupted (invalid JSON)');
        }
      }

      // Check time entries data
      const entriesData = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      if (entriesData) {
        try {
          const entries = JSON.parse(entriesData);
          const validation = this.validateData(entries, 'timeEntries');
          if (!validation.isValid) {
            errors.push(...validation.errors.map((e) => `TimeEntries: ${e}`));
          }
        } catch (parseError) {
          errors.push('TimeEntries data is corrupted (invalid JSON)');
        }
      }

      const corrupted = errors.length > 0;

      // Attempt recovery if corrupted
      let recovered = false;
      if (corrupted) {
        const restoreResult = this.restoreBackup();
        recovered = restoreResult.success;

        if (!recovered) {
          // If restore fails, clear corrupted data
          try {
            if (workersData && errors.some((e) => e.includes('Workers'))) {
              localStorage.removeItem(STORAGE_KEYS.WORKERS);
            }
            if (entriesData && errors.some((e) => e.includes('TimeEntries'))) {
              localStorage.removeItem(STORAGE_KEYS.TIME_ENTRIES);
            }
          } catch (clearError) {
            ErrorHandler.handleError(
              clearError,
              ErrorType.STORAGE,
              ErrorSeverity.HIGH,
              { operation: 'clearCorruptedData' }
            );
          }
        }
      }

      return {
        corrupted,
        recovered,
        errors,
      };
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.CRITICAL,
        { operation: 'checkAndRecover' }
      );
      return {
        corrupted: true,
        recovered: false,
        errors: ['Failed to check data integrity'],
      };
    }
  }

  /**
   * Get backup timestamp
   */
  static getBackupTimestamp(): string | null {
    try {
      return localStorage.getItem(BACKUP_KEYS.TIMESTAMP);
    } catch {
      return null;
    }
  }

  /**
   * Clear all backups
   */
  static clearBackups(): void {
    try {
      localStorage.removeItem(BACKUP_KEYS.WORKERS);
      localStorage.removeItem(BACKUP_KEYS.TIME_ENTRIES);
      localStorage.removeItem(BACKUP_KEYS.TIMESTAMP);
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'clearBackups' }
      );
    }
  }
}

