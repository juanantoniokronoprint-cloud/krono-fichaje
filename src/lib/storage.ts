import { Worker, TimeEntry, Location } from '../types';

const STORAGE_KEYS = {
  WORKERS: 'time-tracking-workers',
  TIME_ENTRIES: 'time-tracking-entries',
} as const;

// Worker storage operations
export class WorkerStorage {
  static getAll(): Worker[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading workers:', error);
      return [];
    }
  }

  static save(workers: Worker[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
    } catch (error) {
      console.error('Error saving workers:', error);
    }
  }

  static create(worker: Omit<Worker, 'id'>): Worker {
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
    if (index === -1) return null;
    
    workers[index] = { ...workers[index], ...updates };
    this.save(workers);
    return workers[index];
  }

  static delete(id: string): boolean {
    const workers = this.getAll();
    const filteredWorkers = workers.filter(w => w.id !== id);
    if (filteredWorkers.length === workers.length) return false;
    
    this.save(filteredWorkers);
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading time entries:', error);
      return [];
    }
  }

  static save(entries: TimeEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving time entries:', error);
    }
  }

  static create(entry: Omit<TimeEntry, 'id'>): TimeEntry {
    const entries = this.getAll();
    const newEntry: TimeEntry = {
      ...entry,
      id: generateId(),
    };
    entries.push(newEntry);
    this.save(entries);
    return newEntry;
  }

  static update(id: string, updates: Partial<TimeEntry>): TimeEntry | null {
    const entries = this.getAll();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    entries[index] = { ...entries[index], ...updates };
    this.save(entries);
    return entries[index];
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
  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await this.reverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            address,
          });
        },
        (error) => {
          reject(new Error('Failed to get location: ' + error.message));
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
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
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