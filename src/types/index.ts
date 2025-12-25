export interface Worker {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface TimeEntry {
  id: string;
  workerId: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  location: Location;
  totalHours?: number;
  overtime?: number;
  notes?: string;
}

export interface BreakEntry {
  id: string;
  timeEntryId: string;
  start: string;
  end?: string;
  type: 'break' | 'lunch' | 'other';
  duration?: number;
}

export interface DailyStats {
  date: string;
  totalWorkers: number;
  activeWorkers: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerWorker: number;
}

export interface WorkerStats {
  workerId: string;
  workerName: string;
  totalHours: number;
  overtimeHours: number;
  averageDailyHours: number;
  daysWorked: number;
  lastClockIn?: string;
  lastClockOut?: string;
}

export interface DashboardData {
  activeWorkers: number;
  todayTotalHours: number;
  todayOvertimeHours: number;
  totalWorkers: number;
  recentEntries: TimeEntry[];
  currentTime: string;
}

export type TimeEntryStatus = 'clocked-in' | 'on-break' | 'clocked-out';

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  workerId?: string;
  department?: string;
  status?: TimeEntryStatus;
}

export interface ExportData {
  workers: Worker[];
  timeEntries: TimeEntry[];
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
}