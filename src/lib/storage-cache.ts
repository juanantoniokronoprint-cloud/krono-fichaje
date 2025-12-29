/**
 * Storage Cache System
 * Provides in-memory caching for frequently accessed data with intelligent invalidation
 */

import { Worker, TimeEntry } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheStore {
  workers: CacheEntry<Worker[]> | null;
  timeEntries: CacheEntry<TimeEntry[]> | null;
  version: number;
}

class StorageCache {
  private cache: CacheStore = {
    workers: null,
    timeEntries: null,
    version: 1,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes

  /**
   * Get workers from cache or return null if cache miss
   */
  getWorkers(): Worker[] | null {
    const cached = this.cache.workers;
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.MAX_CACHE_AGE) {
      this.cache.workers = null;
      return null;
    }

    return cached.data;
  }

  /**
   * Get time entries from cache or return null if cache miss
   */
  getTimeEntries(): TimeEntry[] | null {
    const cached = this.cache.timeEntries;
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.MAX_CACHE_AGE) {
      this.cache.timeEntries = null;
      return null;
    }

    return cached.data;
  }

  /**
   * Set workers in cache
   */
  setWorkers(workers: Worker[]): void {
    this.cache.workers = {
      data: [...workers], // Create a copy
      timestamp: Date.now(),
      version: this.cache.version,
    };
  }

  /**
   * Set time entries in cache
   */
  setTimeEntries(entries: TimeEntry[]): void {
    this.cache.timeEntries = {
      data: [...entries], // Create a copy
      timestamp: Date.now(),
      version: this.cache.version,
    };
  }

  /**
   * Invalidate cache (mark as stale)
   */
  invalidate(type?: 'workers' | 'timeEntries' | 'all'): void {
    this.cache.version++;
    
    if (type === 'workers') {
      this.cache.workers = null;
    } else if (type === 'timeEntries') {
      this.cache.timeEntries = null;
    } else {
      // Invalidate all
      this.cache.workers = null;
      this.cache.timeEntries = null;
    }
  }

  /**
   * Check if cache is fresh (within TTL)
   */
  isFresh(type: 'workers' | 'timeEntries'): boolean {
    const cached = type === 'workers' ? this.cache.workers : this.cache.timeEntries;
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < this.CACHE_TTL;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.workers = null;
    this.cache.timeEntries = null;
    this.cache.version++;
  }

  /**
   * Update a single worker in cache
   */
  updateWorkerInCache(worker: Worker): void {
    const cached = this.cache.workers;
    if (!cached) return;

    const index = cached.data.findIndex((w) => w.id === worker.id);
    if (index !== -1) {
      cached.data[index] = worker;
    } else {
      cached.data.push(worker);
    }
    cached.timestamp = Date.now();
  }

  /**
   * Remove worker from cache
   */
  removeWorkerFromCache(workerId: string): void {
    const cached = this.cache.workers;
    if (!cached) return;

    cached.data = cached.data.filter((w) => w.id !== workerId);
    cached.timestamp = Date.now();
  }

  /**
   * Update a single time entry in cache
   */
  updateTimeEntryInCache(entry: TimeEntry): void {
    const cached = this.cache.timeEntries;
    if (!cached) return;

    const index = cached.data.findIndex((e) => e.id === entry.id);
    if (index !== -1) {
      cached.data[index] = entry;
    } else {
      cached.data.push(entry);
    }
    cached.timestamp = Date.now();
  }

  /**
   * Remove time entry from cache
   */
  removeTimeEntryFromCache(entryId: string): void {
    const cached = this.cache.timeEntries;
    if (!cached) return;

    cached.data = cached.data.filter((e) => e.id !== entryId);
    cached.timestamp = Date.now();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hasWorkers: boolean;
    hasTimeEntries: boolean;
    workersAge: number | null;
    entriesAge: number | null;
  } {
    return {
      hasWorkers: this.cache.workers !== null,
      hasTimeEntries: this.cache.timeEntries !== null,
      workersAge: this.cache.workers ? Date.now() - this.cache.workers.timestamp : null,
      entriesAge: this.cache.timeEntries ? Date.now() - this.cache.timeEntries.timestamp : null,
    };
  }
}

// Export singleton instance
export const storageCache = new StorageCache();

