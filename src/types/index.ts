export interface Worker {
  id: string;
  employeeNumber?: string;
  name: string;
  email: string;
  position: string;
  department: string;
  managerId?: string;
  skills?: string[];
  employmentType: 'full-time' | 'part-time' | 'contractor' | 'intern';
  location?: string;
  costCenter?: string;
  hireDate: string;
  terminationDate?: string;
  hourlyRate: number;
  overtimeRate?: number; // Different rate for overtime
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
  projectId?: string;
  taskId?: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  location: Location;
  ipAddress?: string;
  deviceId?: string;
  totalHours?: number;
  overtime?: number;
  doubleTime?: number; // Hours beyond overtime threshold
  holidayHours?: number;
  sickHours?: number;
  remoteWork?: boolean;
  approvedBy?: string;
  approvalDate?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  notes?: string;
  tags?: string[];
  billable?: boolean;
  hourlyRate?: number; // Override worker rate for this entry
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

// Advanced Analytics Types
export interface PayrollData {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  sickHours: number;
  totalPay: number;
  taxDeductions: number;
  netPay: number;
  payDate: string;
}

export interface AttendancePattern {
  workerId: string;
  date: string;
  expectedHours: number;
  actualHours: number;
  punctualityScore: number; // 0-100
  attendanceStatus: 'present' | 'absent' | 'late' | 'early-leave' | 'partial';
  tardinessMinutes: number;
  earlyDepartureMinutes: number;
}

export interface PerformanceMetrics {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  productivityScore: number; // 0-100
  consistencyScore: number; // 0-100
  reliabilityScore: number; // 0-100
  totalScore: number; // 0-100
  trends: {
    direction: 'improving' | 'declining' | 'stable';
    changePercentage: number;
  };
}

export interface DepartmentAnalytics {
  department: string;
  periodStart: string;
  periodEnd: string;
  totalWorkers: number;
  activeWorkers: number;
  averageHoursPerWorker: number;
  totalOvertimeHours: number;
  productivityIndex: number;
  attendanceRate: number;
  turnoverRisk: number; // 0-100
  costPerHour: number;
}

export interface TimeAnalytics {
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  averageHoursPerDay: number;
  peakHours: {
    hour: number;
    workerCount: number;
  }[];
  weeklyTrends: {
    week: string;
    totalHours: number;
    averageWorkers: number;
  }[];
  monthlyTrends: {
    month: string;
    totalHours: number;
    totalOvertime: number;
  }[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  status: 'good' | 'warning' | 'critical';
}

export interface AdvancedFilter extends FilterOptions {
  includeWeekends?: boolean;
  includeHolidays?: boolean;
  minHours?: number;
  maxHours?: number;
  includeRemoteWork?: boolean;
  locationFilter?: string[];
  skillFilter?: string[];
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'payroll' | 'attendance' | 'productivity' | 'cost-analysis' | 'custom';
  filters: AdvancedFilter;
  groupBy: 'day' | 'week' | 'month' | 'department' | 'worker';
  metrics: string[];
  format: 'table' | 'chart' | 'both';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    nextRun: string;
  };
}

export interface BusinessInsights {
  topPerformers: {
    workerId: string;
    workerName: string;
    score: number;
    trend: string;
  }[];
  attendanceIssues: {
    workerId: string;
    workerName: string;
    issueType: string;
    frequency: number;
  }[];
  costOptimization: {
    opportunity: string;
    potentialSavings: number;
    impact: 'high' | 'medium' | 'low';
  }[];
  productivityAlerts: {
    department: string;
    metric: string;
    currentValue: number;
    expectedValue: number;
    severity: 'warning' | 'critical';
  }[];
}