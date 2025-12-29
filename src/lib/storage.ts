import { Worker, TimeEntry, Location } from '../types';
import { ErrorHandler, ErrorType, ErrorSeverity, StorageError } from './error-handler';
import { storageCache } from './storage-cache';
import { DataRecovery } from './data-recovery';
import { validateWorker, validateTimeEntry } from './validators';

const STORAGE_KEYS = {
  WORKERS: 'time-tracking-workers',
  TIME_ENTRIES: 'time-tracking-entries',
} as const;

// Initialize data recovery check on module load
(() => {
  try {
    const result = DataRecovery.checkAndRecover();
    if (result.corrupted && !result.recovered) {
      ErrorHandler.handleError(
        new Error('Data corruption detected and recovery failed'),
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { errors: result.errors }
      );
    }
  } catch (error) {
    ErrorHandler.handleError(error, ErrorType.STORAGE, ErrorSeverity.MEDIUM, { operation: 'init' });
  }
})();

// Worker storage operations
export class WorkerStorage {
  static getAll(): Worker[] {
    // Check cache first
    const cached = storageCache.getWorkers();
    if (cached !== null && storageCache.isFresh('workers')) {
      return cached;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
      if (!data) {
        storageCache.setWorkers([]);
        return [];
      }

      const workers = JSON.parse(data);

      // Validate data schema
      const validation = DataRecovery.validateData(workers, 'workers');
      if (!validation.isValid) {
        throw new StorageError(
          'Invalid workers data schema',
          'Los datos de trabajadores están corruptos',
          'INVALID_SCHEMA'
        );
      }

      storageCache.setWorkers(workers);
      return workers;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'getAll', dataType: 'workers' }
      );

      // Try to recover from backup
      const recovery = DataRecovery.restoreBackup();
      if (recovery.success && recovery.restoredData?.workers) {
        storageCache.setWorkers(recovery.restoredData.workers);
        return recovery.restoredData.workers;
      }

      storageCache.invalidate('workers');
      return [];
    }
  }

  static save(workers: Worker[]): void {
    try {
      // Create backup before saving
      DataRecovery.createBackup();

      // Check storage availability
      const storageCheck = ErrorHandler.checkStorageAvailability();
      if (!storageCheck.available) {
        throw new StorageError(
          'Storage not available',
          storageCheck.message || 'El almacenamiento no está disponible',
          'STORAGE_UNAVAILABLE'
        );
      }

      const jsonData = JSON.stringify(workers);
      localStorage.setItem(STORAGE_KEYS.WORKERS, jsonData);

      // Update cache
      storageCache.setWorkers(workers);
    } catch (error) {
      const storageError = error instanceof StorageError 
        ? error 
        : new StorageError(
            'Failed to save workers',
            'Error al guardar los trabajadores. Por favor, intenta nuevamente.',
            'SAVE_FAILED'
          );

      ErrorHandler.handleError(
        storageError,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'save', dataType: 'workers', count: workers.length }
      );
      
      storageCache.invalidate('workers');
      throw storageError;
    }
  }

  static create(worker: Omit<Worker, 'id'>): Worker {
    // Validate worker data before creating
    const validation = validateWorker(worker, false);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const workers = this.getAll();
    const id = generateId();
    
    // Generate employeeNumber if not provided (use sequential number)
    let employeeNumber = worker.employeeNumber;
    if (!employeeNumber) {
      employeeNumber = this.generateEmployeeNumber(workers);
    }
    
    const newWorker: Worker = {
      ...worker,
      employeeNumber,
      id,
    };
    workers.push(newWorker);
    this.save(workers);
    
    // Update cache
    storageCache.updateWorkerInCache(newWorker);
    
    return newWorker;
  }

  static generateEmployeeNumber(workers: Worker[]): string {
    // Generate a unique 6-digit employee number
    // Find the highest existing number and add 1
    const existingNumbers = workers
      .map(w => w.employeeNumber ? parseInt(w.employeeNumber) : 0)
      .filter(n => !isNaN(n) && n > 0);
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const newNumber = maxNumber + 1;
    
    // Ensure it's 6 digits with leading zeros
    return newNumber.toString().padStart(6, '0');
  }

  static update(id: string, updates: Partial<Worker>): Worker | null {
    const workers = this.getAll();
    const index = workers.findIndex(w => w.id === id);
    if (index === -1) {
      ErrorHandler.handleError(
        new Error(`Worker with id ${id} not found`),
        ErrorType.BUSINESS_LOGIC,
        ErrorSeverity.LOW,
        { operation: 'update', workerId: id }
      );
      return null;
    }
    
    const updatedWorker = { ...workers[index], ...updates };
    
    // Validate updated worker
    const validation = validateWorker(updatedWorker, true);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }
    
    workers[index] = updatedWorker;
    this.save(workers);
    
    // Update cache
    storageCache.updateWorkerInCache(updatedWorker);
    
    return updatedWorker;
  }

  static delete(id: string): boolean {
    const workers = this.getAll();
    const filteredWorkers = workers.filter(w => w.id !== id);
    if (filteredWorkers.length === workers.length) {
      ErrorHandler.handleError(
        new Error(`Worker with id ${id} not found for deletion`),
        ErrorType.BUSINESS_LOGIC,
        ErrorSeverity.LOW,
        { operation: 'delete', workerId: id }
      );
      return false;
    }
    
    this.save(filteredWorkers);
    
    // Update cache
    storageCache.removeWorkerFromCache(id);
    
    return true;
  }

  static findById(id: string): Worker | null {
    const workers = this.getAll();
    return workers.find(w => w.id === id) || null;
  }

  static getActive(): Worker[] {
    return this.getAll().filter(w => w.isActive);
  }
}

// Time entry storage operations
export class TimeEntryStorage {
  static getAll(): TimeEntry[] {
    // Check cache first
    const cached = storageCache.getTimeEntries();
    if (cached !== null && storageCache.isFresh('timeEntries')) {
      return cached;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      if (!data) {
        storageCache.setTimeEntries([]);
        return [];
      }

      const entries = JSON.parse(data);

      // Validate data schema
      const validation = DataRecovery.validateData(entries, 'timeEntries');
      if (!validation.isValid) {
        throw new StorageError(
          'Invalid time entries data schema',
          'Los datos de registros de tiempo están corruptos',
          'INVALID_SCHEMA'
        );
      }

      storageCache.setTimeEntries(entries);
      return entries;
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'getAll', dataType: 'timeEntries' }
      );

      // Try to recover from backup
      const recovery = DataRecovery.restoreBackup();
      if (recovery.success && recovery.restoredData?.timeEntries) {
        storageCache.setTimeEntries(recovery.restoredData.timeEntries);
        return recovery.restoredData.timeEntries;
      }

      storageCache.invalidate('timeEntries');
      return [];
    }
  }

  static save(entries: TimeEntry[]): void {
    try {
      // Create backup before saving
      DataRecovery.createBackup();

      // Check storage availability
      const storageCheck = ErrorHandler.checkStorageAvailability();
      if (!storageCheck.available) {
        throw new StorageError(
          'Storage not available',
          storageCheck.message || 'El almacenamiento no está disponible',
          'STORAGE_UNAVAILABLE'
        );
      }

      const jsonData = JSON.stringify(entries);
      localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, jsonData);

      // Update cache
      storageCache.setTimeEntries(entries);
    } catch (error) {
      const storageError = error instanceof StorageError 
        ? error 
        : new StorageError(
            'Failed to save time entries',
            'Error al guardar los registros de tiempo. Por favor, intenta nuevamente.',
            'SAVE_FAILED'
          );

      ErrorHandler.handleError(
        storageError,
        ErrorType.STORAGE,
        ErrorSeverity.HIGH,
        { operation: 'save', dataType: 'timeEntries', count: entries.length }
      );
      
      storageCache.invalidate('timeEntries');
      throw storageError;
    }
  }

  static create(entry: Omit<TimeEntry, 'id'>): TimeEntry {
    // Validate entry data before creating
    const validation = validateTimeEntry(entry);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }

    const entries = this.getAll();
    const newEntry: TimeEntry = {
      ...entry,
      id: generateId(),
    };
    entries.push(newEntry);
    this.save(entries);
    
    // Update cache
    storageCache.updateTimeEntryInCache(newEntry);
    
    return newEntry;
  }

  static update(id: string, updates: Partial<TimeEntry>): TimeEntry | null {
    const entries = this.getAll();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) {
      ErrorHandler.handleError(
        new Error(`Time entry with id ${id} not found`),
        ErrorType.BUSINESS_LOGIC,
        ErrorSeverity.LOW,
        { operation: 'update', entryId: id }
      );
      return null;
    }
    
    const updatedEntry = { ...entries[index], ...updates };
    
    // Validate updated entry
    const validation = validateTimeEntry(updatedEntry);
    if (!validation.isValid) {
      throw new StorageError(
        validation.errors.join('; '),
        validation.errors.join('. '),
        'VALIDATION_FAILED'
      );
    }
    
    entries[index] = updatedEntry;
    this.save(entries);
    
    // Update cache
    storageCache.updateTimeEntryInCache(updatedEntry);
    
    return updatedEntry;
  }

  static findByWorkerId(workerId: string): TimeEntry[] {
    return this.getAll().filter(e => e.workerId === workerId);
  }

  static getActiveEntries(): TimeEntry[] {
    return this.getAll().filter(e => !e.clockOut);
  }

  static getTodayEntries(): TimeEntry[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getAll().filter(e => 
      e.clockIn.startsWith(today) || 
      (e.clockOut && e.clockOut.startsWith(today))
    );
  }

  static getEntriesByDateRange(startDate: string, endDate: string): TimeEntry[] {
    return this.getAll().filter(e => {
      const entryDate = e.clockIn.split('T')[0];
      return entryDate >= startDate && entryDate <= endDate;
    });
  }
}

// Geolocation utilities
export class LocationService {
  private static locationLock: boolean = false;

  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported');
        ErrorHandler.handleError(
          error,
          ErrorType.BUSINESS_LOGIC,
          ErrorSeverity.MEDIUM,
          { operation: 'getCurrentLocation' }
        );
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Validate coordinates
            if (isNaN(latitude) || isNaN(longitude) || 
                latitude < -90 || latitude > 90 || 
                longitude < -180 || longitude > 180) {
              throw new Error('Invalid coordinates received');
            }

            const address = await this.reverseGeocode(latitude, longitude);
            resolve({
              latitude,
              longitude,
              address,
            });
          } catch (error) {
            ErrorHandler.handleError(
              error,
              ErrorType.NETWORK,
              ErrorSeverity.LOW,
              { operation: 'getCurrentLocation', step: 'reverseGeocode' }
            );
            // Still resolve with coordinates even if geocoding fails
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            });
          }
        },
        (error) => {
          let userMessage = 'Error al obtener la ubicación';
          if (error.code === 1) {
            userMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación.';
          } else if (error.code === 2) {
            userMessage = 'No se pudo determinar la ubicación. Verifica tu conexión.';
          } else if (error.code === 3) {
            userMessage = 'La solicitud de ubicación tardó demasiado. Intenta nuevamente.';
          }

          const locationError = new Error(`Failed to get location: ${error.message}`);
          ErrorHandler.handleError(
            locationError,
            ErrorType.NETWORK,
            ErrorSeverity.MEDIUM,
            { operation: 'getCurrentLocation', errorCode: error.code }
          );
          reject(new Error(userMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  private static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Using a free reverse geocoding service with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Geocoding API returned ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || data.locality || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      // If geocoding fails, return coordinates
      // Error is already logged in getCurrentLocation
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
}

// Helper functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function calculateTotalHours(clockIn: string, clockOut: string, breakMinutes: number = 0): number {
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  return Math.max(0, (totalMinutes - breakMinutes) / 60);
}

// Import the new time calculator
import { TimeCalculator, DEFAULT_SHIFT_POLICY } from './time-calculations';

export function calculateEntryHours(entry: TimeEntry): ReturnType<typeof TimeCalculator.calculateEntryHours> {
  return TimeCalculator.calculateEntryHours(entry, DEFAULT_SHIFT_POLICY);
}

export function calculateWeeklyHours(entries: TimeEntry[]): ReturnType<typeof TimeCalculator.calculateWeeklyHours> {
  return TimeCalculator.calculateWeeklyHours(entries, DEFAULT_SHIFT_POLICY);
}

export function calculatePayroll(workerId: string, entries: TimeEntry[], hourlyRate: number): ReturnType<typeof TimeCalculator.calculatePayroll> {
  return TimeCalculator.calculatePayroll(workerId, entries, hourlyRate, DEFAULT_SHIFT_POLICY);
}

export function isOvertime(hours: number, standardHours: number = 8): boolean {
  return hours > standardHours;
}

export function calculateOvertime(hours: number, standardHours: number = 8): number {
  return Math.max(0, hours - standardHours);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}