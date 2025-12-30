/**
 * API Storage Module
 * Wrapper for API Routes that replaces localStorage storage
 * Maintains the same interface as storage.ts for compatibility
 */

import { Worker, TimeEntry, DashboardData, WorkerStats } from '../types';
import { ErrorHandler, ErrorType, ErrorSeverity, StorageError } from './error-handler';
import { validateWorker, validateTimeEntry } from './validators';
import { storageCache } from './storage-cache';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

/**
 * Helper function to make API calls
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new StorageError(
        errorData.error || `HTTP ${response.status}`,
        errorData.error || 'Error al realizar la operación',
        'API_ERROR'
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    ErrorHandler.handleError(
      error,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      { operation: 'api_call', endpoint }
    );

    throw new StorageError(
      error instanceof Error ? error.message : 'Error de red',
      'Error de conexión. Por favor, verifica tu conexión a internet.',
      'NETWORK_ERROR'
    );
  }
}

// Worker storage operations
export class WorkerStorage {
  static async getAll(): Promise<Worker[]> {
    // Check cache first
    const cached = storageCache.getWorkers();
    if (cached !== null && storageCache.isFresh('workers')) {
      return cached;
    }

    try {
      const workers = await apiCall<Worker[]>('/workers');
      storageCache.setWorkers(workers);
      return workers;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'getAll', dataType: 'workers' }
      );
      
      // Return cached data if available
      if (cached !== null) {
        return cached;
      }
      
      storageCache.invalidate('workers');
      return [];
    }
  }

  static async save(workers: Worker[]): Promise<void> {
    // Note: This method is kept for compatibility, but bulk save is not supported via API
    // Individual create/update operations should be used instead
    storageCache.setWorkers(workers);
  }

  static async create(worker: Omit<Worker, 'id'>): Promise<Worker> {
    // Validate worker data before creating
    const validation = validateWorker(worker, false);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    try {
      const newWorker = await apiCall<Worker>('/workers', {
        method: 'POST',
        body: JSON.stringify(worker),
      });

      // Update cache
      storageCache.updateWorkerInCache(newWorker);

      return newWorker;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'create', dataType: 'workers' }
      );
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Worker>): Promise<Worker | null> {
    // Validate updated worker
    const validation = validateWorker({ ...updates, id } as Worker, true);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    try {
      const updatedWorker = await apiCall<Worker>(`/workers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      // Update cache
      storageCache.updateWorkerInCache(updatedWorker);

      return updatedWorker;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'update', dataType: 'workers', workerId: id }
      );
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await apiCall<{ success: boolean }>(`/workers/${id}`, {
        method: 'DELETE',
      });

      // Update cache
      storageCache.removeWorkerFromCache(id);

      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'delete', dataType: 'workers', workerId: id }
      );
      return false;
    }
  }

  static async findById(id: string): Promise<Worker | null> {
    // Check cache first
    const cached = storageCache.getWorkers();
    if (cached !== null) {
      const worker = cached.find(w => w.id === id);
      if (worker) {
        return worker;
      }
    }

    try {
      const worker = await apiCall<Worker>(`/workers/${id}`);
      if (worker) {
        storageCache.updateWorkerInCache(worker);
      }
      return worker;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'findById', dataType: 'workers', workerId: id }
      );
      return null;
    }
  }

  static async getActive(): Promise<Worker[]> {
    try {
      const workers = await apiCall<Worker[]>('/workers?active=true');
      return workers;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'getActive', dataType: 'workers' }
      );
      return [];
    }
  }

  static generateEmployeeNumber(workers: Worker[]): string {
    // Generate a unique 6-digit employee number
    const existingNumbers = workers
      .map(w => w.employeeNumber ? parseInt(w.employeeNumber) : 0)
      .filter(n => !isNaN(n) && n > 0);
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const newNumber = maxNumber + 1;
    
    return newNumber.toString().padStart(6, '0');
  }
}

// Time entry storage operations
export class TimeEntryStorage {
  static async getAll(): Promise<TimeEntry[]> {
    // Check cache first
    const cached = storageCache.getTimeEntries();
    if (cached !== null && storageCache.isFresh('timeEntries')) {
      return cached;
    }

    try {
      const entries = await apiCall<TimeEntry[]>('/time-entries');
      storageCache.setTimeEntries(entries);
      return entries;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'getAll', dataType: 'timeEntries' }
      );
      
      // Return cached data if available
      if (cached !== null) {
        return cached;
      }
      
      storageCache.invalidate('timeEntries');
      return [];
    }
  }

  static async save(entries: TimeEntry[]): Promise<void> {
    // Note: This method is kept for compatibility, but bulk save is not supported via API
    storageCache.setTimeEntries(entries);
  }

  static async create(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    // Validate entry data before creating
    const validation = validateTimeEntry(entry);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    try {
      const newEntry = await apiCall<TimeEntry>('/time-entries', {
        method: 'POST',
        body: JSON.stringify(entry),
      });

      // Update cache
      storageCache.updateTimeEntryInCache(newEntry);

      return newEntry;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'create', dataType: 'timeEntries' }
      );
      throw error;
    }
  }

  static async update(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
    // Note: Validation is done on the server side with the complete entry
    // We don't validate partial updates here to avoid false positives

    try {
      const updatedEntry = await apiCall<TimeEntry>(`/time-entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      // Update cache
      storageCache.updateTimeEntryInCache(updatedEntry);

      return updatedEntry;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'update', dataType: 'timeEntries', entryId: id }
      );
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await apiCall<{ success: boolean }>(`/time-entries/${id}`, {
        method: 'DELETE',
      });

      // Update cache
      storageCache.removeTimeEntryFromCache(id);

      return true;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'delete', dataType: 'timeEntries', entryId: id }
      );
      return false;
    }
  }

  static async findById(id: string): Promise<TimeEntry | null> {
    try {
      const entry = await apiCall<TimeEntry>(`/time-entries/${id}`);
      if (entry) {
        storageCache.updateTimeEntryInCache(entry);
      }
      return entry;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'findById', dataType: 'timeEntries', entryId: id }
      );
      return null;
    }
  }

  static async getByWorkerId(workerId: string): Promise<TimeEntry[]> {
    try {
      const entries = await apiCall<TimeEntry[]>(`/time-entries?workerId=${workerId}`);
      return entries;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'getByWorkerId', dataType: 'timeEntries', workerId }
      );
      return [];
    }
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<TimeEntry[]> {
    try {
      const entries = await apiCall<TimeEntry[]>(`/time-entries?startDate=${startDate}&endDate=${endDate}`);
      return entries;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'getByDateRange', dataType: 'timeEntries' }
      );
      return [];
    }
  }

  static async getActiveEntries(): Promise<TimeEntry[]> {
    const allEntries = await this.getAll();
    return allEntries.filter(entry => !entry.clockOut);
  }
}

// Stats operations
export class StatsStorage {
  static async getDashboardStats(): Promise<DashboardData> {
    try {
      const stats = await apiCall<DashboardData>('/stats?type=dashboard');
      return stats;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'getDashboardStats' }
      );
      throw error;
    }
  }

  static async getWorkerStats(workerId: string): Promise<WorkerStats> {
    try {
      const stats = await apiCall<WorkerStats>(`/stats/worker/${workerId}`);
      return stats;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.LOW,
        { operation: 'getWorkerStats', workerId }
      );
      throw error;
    }
  }
}

// Settings storage operations
export class SettingsStorage {
  static async getAll(): Promise<Record<string, string>> {
    try {
      return await apiCall<Record<string, string>>('/settings');
    } catch (error) {
      console.error('Error loading settings:', error);
      return { admin_pin: '123456' }; // Return default
    }
  }

  static async get(key: string): Promise<string | null> {
    try {
      const data = await apiCall<Record<string, string | null>>(`/settings?key=${key}`);
      return data[key] || null;
    } catch (error) {
      console.error(`Error loading setting ${key}:`, error);
      return key === 'admin_pin' ? '123456' : null;
    }
  }

  static async update(settings: Record<string, string>): Promise<void> {
    try {
      await apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.MEDIUM,
        { operation: 'updateSettings' }
      );
      throw error;
    }
  }
}

// Re-export utility functions from storage.ts for compatibility
export {
  formatTime,
  formatDate,
  formatDateTime,
  formatDuration,
  calculateTotalHours,
  calculateOvertime,
  isOvertime,
  calculateEntryHours,
  calculateWeeklyHours,
  calculatePayroll,
  generateId,
} from './storage';
