import { 
  Worker, 
  TimeEntry, 
  PayrollData, 
  AttendancePattern, 
  PerformanceMetrics, 
  DepartmentAnalytics, 
  TimeAnalytics, 
  KPI, 
  BusinessInsights,
  ChartData 
} from '../types';
import { TimeEntryStorage, WorkerStorage } from './storage';
import { TimeCalculator } from './time-calculations';

export class AnalyticsEngine {
  // Payroll Analysis
  static calculatePayrollData(
    workerId: string,
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): PayrollData {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) throw new Error('Worker not found');

    const entries = timeEntries.filter(entry =>
      entry.workerId === workerId &&
      this.isInDateRange(entry.clockIn, periodStart, periodEnd)
    );

    // Use the new time calculator for accurate payroll calculations
    const payrollResult = TimeCalculator.calculatePayroll(
      workerId,
      entries,
      worker.hourlyRate
    );

    // Calculate additional hours (holiday, sick, etc.)
    let holidayHours = 0;
    let sickHours = 0;
    let totalPay = payrollResult.totalPay;

    entries.forEach(entry => {
      const isHoliday = this.isHoliday(entry.clockIn);
      const isSick = entry.tags?.includes('sick') || false;

      if (isHoliday) {
        holidayHours += payrollResult.hoursBreakdown.regularHours;
        // Holiday pay is already included in totalPay with premium rates
      } else if (isSick) {
        sickHours += payrollResult.hoursBreakdown.regularHours;
        // Sick pay is already included in totalPay
      }
    });

    const taxDeductions = totalPay * 0.25; // 25% tax rate
    const netPay = totalPay - taxDeductions;

    return {
      workerId,
      periodStart,
      periodEnd,
      regularHours: payrollResult.hoursBreakdown.regularHours,
      overtimeHours: payrollResult.hoursBreakdown.overtimeHours,
      holidayHours,
      sickHours,
      totalPay,
      taxDeductions,
      netPay,
      payDate: new Date().toISOString()
    };
  }

  // Attendance Pattern Analysis
  static analyzeAttendancePatterns(
    workers: Worker[],
    timeEntries: TimeEntry[],
    startDate: string,
    endDate: string
  ): AttendancePattern[] {
    const patterns: AttendancePattern[] = [];
    const workStartHour = 9; // 9 AM
    const expectedHours = 8;

    workers.forEach(worker => {
      const entries = timeEntries.filter(entry => 
        entry.workerId === worker.id && 
        this.isInDateRange(entry.clockIn, startDate, endDate)
      );

      // Group entries by date
      const entriesByDate = this.groupEntriesByDate(entries);

      Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
        const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
        const firstEntry = dayEntries[0];
        const lastEntry = dayEntries[dayEntries.length - 1];

        // Calculate punctuality
        const clockInHour = firstEntry ? new Date(firstEntry.clockIn).getHours() : 0;
        const tardinessMinutes = Math.max(0, (clockInHour - workStartHour) * 60);

        // Calculate early departure
        const expectedEndHour = workStartHour + expectedHours;
        const clockOutHour = lastEntry?.clockOut ? new Date(lastEntry.clockOut).getHours() : expectedEndHour;
        const earlyDepartureMinutes = Math.max(0, (expectedEndHour - clockOutHour) * 60);

        // Calculate punctuality score (100 = perfect, 0 = very late)
        const punctualityScore = Math.max(0, 100 - (tardinessMinutes / 60) * 20);

        let attendanceStatus: 'present' | 'absent' | 'late' | 'early-leave' | 'partial' = 'present';
        if (totalHours === 0) {
          attendanceStatus = 'absent';
        } else if (tardinessMinutes > 15) {
          attendanceStatus = 'late';
        } else if (earlyDepartureMinutes > 15) {
          attendanceStatus = 'early-leave';
        } else if (totalHours < expectedHours * 0.8) {
          attendanceStatus = 'partial';
        }

        patterns.push({
          workerId: worker.id,
          date,
          expectedHours,
          actualHours: totalHours,
          punctualityScore,
          attendanceStatus,
          tardinessMinutes,
          earlyDepartureMinutes
        });
      });
    });

    return patterns;
  }

  // Performance Metrics Calculation
  static calculatePerformanceMetrics(
    workerId: string,
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): PerformanceMetrics {
    const patterns = this.analyzeAttendancePatterns(
      workers.filter(w => w.id === workerId),
      timeEntries.filter(e => e.workerId === workerId),
      periodStart,
      periodEnd
    );

    if (patterns.length === 0) {
      return {
        workerId,
        periodStart,
        periodEnd,
        productivityScore: 0,
        consistencyScore: 0,
        reliabilityScore: 0,
        totalScore: 0,
        trends: {
          direction: 'stable',
          changePercentage: 0
        }
      };
    }

    // Calculate productivity score based on hours worked vs expected
    const productivityScore = patterns.reduce((sum, pattern) => {
      const efficiency = Math.min(100, (pattern.actualHours / pattern.expectedHours) * 100);
      return sum + efficiency;
    }, 0) / patterns.length;

    // Calculate consistency score based on punctuality
    const consistencyScore = patterns.reduce((sum, pattern) => sum + pattern.punctualityScore, 0) / patterns.length;

    // Calculate reliability score based on attendance
    const presentDays = patterns.filter(p => p.attendanceStatus === 'present').length;
    const reliabilityScore = (presentDays / patterns.length) * 100;

    const totalScore = (productivityScore * 0.4 + consistencyScore * 0.3 + reliabilityScore * 0.3);

    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(patterns.length / 2);
    const firstHalfAvg = patterns.slice(0, midpoint).reduce((sum, p) => sum + p.punctualityScore, 0) / midpoint;
    const secondHalfAvg = patterns.slice(midpoint).reduce((sum, p) => sum + p.punctualityScore, 0) / (patterns.length - midpoint);
    const changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    const trendDirection: 'improving' | 'declining' | 'stable' = 
      changePercentage > 5 ? 'improving' : 
      changePercentage < -5 ? 'declining' : 'stable';

    return {
      workerId,
      periodStart,
      periodEnd,
      productivityScore,
      consistencyScore,
      reliabilityScore,
      totalScore,
      trends: {
        direction: trendDirection,
        changePercentage
      }
    };
  }

  // Department Analytics
  static calculateDepartmentAnalytics(
    department: string,
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): DepartmentAnalytics {
    const deptWorkers = workers.filter(w => w.department === department && w.isActive);
    const deptEntries = timeEntries.filter(entry => {
      const worker = workers.find(w => w.id === entry.workerId);
      return worker?.department === department && 
             this.isInDateRange(entry.clockIn, periodStart, periodEnd);
    });

    const totalWorkers = deptWorkers.length;
    const activeWorkers = new Set(deptEntries.map(e => e.workerId)).size;
    
    const totalHours = deptEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const averageHoursPerWorker = totalWorkers > 0 ? totalHours / totalWorkers : 0;
    
    // Calculate accurate overtime using the time calculator
    const overtimeResults = deptEntries.map(entry => {
      if (entry.clockOut) {
        const result = TimeCalculator.calculateEntryHours(entry);
        return result.overtimeHours;
      }
      return 0;
    });
    const totalOvertimeHours = overtimeResults.reduce((sum, hours) => sum + hours, 0);

    // Calculate productivity index (based on hours vs expected)
    const expectedHours = totalWorkers * 8 * this.getWorkingDaysInRange(periodStart, periodEnd);
    const productivityIndex = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

    // Calculate attendance rate
    const attendancePatterns = this.analyzeAttendancePatterns(deptWorkers, deptEntries, periodStart, periodEnd);
    const presentDays = attendancePatterns.filter(p => p.attendanceStatus === 'present').length;
    const attendanceRate = attendancePatterns.length > 0 ? (presentDays / attendancePatterns.length) * 100 : 0;

    // Calculate turnover risk (based on attendance issues and overtime)
    const lateDays = attendancePatterns.filter(p => p.attendanceStatus === 'late').length;
    const overtimeDays = deptEntries.filter(e => (e.overtime || 0) > 0).length;
    const turnoverRisk = Math.min(100, (lateDays / attendancePatterns.length) * 50 + (overtimeDays / deptEntries.length) * 50);

    // Calculate cost per hour using accurate payroll calculations
    const totalCost = deptWorkers.reduce((sum, worker) => {
      const workerEntries = deptEntries.filter(e => e.workerId === worker.id);
      const payrollResult = TimeCalculator.calculatePayroll(worker.id, workerEntries, worker.hourlyRate);
      return sum + payrollResult.totalPay;
    }, 0);
    const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;

    return {
      department,
      periodStart,
      periodEnd,
      totalWorkers,
      activeWorkers,
      averageHoursPerWorker,
      totalOvertimeHours,
      productivityIndex,
      attendanceRate,
      turnoverRisk,
      costPerHour
    };
  }

  // Time Analytics
  static calculateTimeAnalytics(
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): TimeAnalytics {
    const filteredEntries = timeEntries.filter(entry => 
      this.isInDateRange(entry.clockIn, periodStart, periodEnd)
    );

    // Calculate accurate total hours using the time calculator
    const totalHours = filteredEntries.reduce((sum, entry) => {
      if (entry.clockOut) {
        const result = TimeCalculator.calculateEntryHours(entry);
        return sum + result.netHours;
      }
      return sum;
    }, 0);
    const workingDays = this.getWorkingDaysInRange(periodStart, periodEnd);
    const averageHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

    // Peak hours analysis
    const hourlyData = new Array(24).fill(0);
    filteredEntries.forEach(entry => {
      const hour = new Date(entry.clockIn).getHours();
      hourlyData[hour]++;
    });
    
    const peakHours = hourlyData
      .map((count, hour) => ({ hour, workerCount: count }))
      .filter(h => h.workerCount > 0)
      .sort((a, b) => b.workerCount - a.workerCount)
      .slice(0, 5);

    // Weekly trends
    const weeklyData = this.groupByWeek(filteredEntries);
    const weeklyTrends = Object.entries(weeklyData).map(([week, entries]) => ({
      week,
      totalHours: entries.reduce((sum, e) => sum + (e.totalHours || 0), 0),
      averageWorkers: new Set(entries.map(e => e.workerId)).size
    }));

    // Monthly trends
    const monthlyData = this.groupByMonth(filteredEntries);
    const monthlyTrends = Object.entries(monthlyData).map(([month, entries]) => ({
      month,
      totalHours: entries.reduce((sum, e) => sum + (e.totalHours || 0), 0),
      totalOvertime: entries.reduce((sum, e) => sum + (e.overtime || 0), 0)
    }));

    return {
      periodStart,
      periodEnd,
      totalHours,
      averageHoursPerDay,
      peakHours,
      weeklyTrends,
      monthlyTrends
    };
  }

  // KPI Calculation
  static calculateKPIs(
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): KPI[] {
    const kpis: KPI[] = [];
    
    // Total Hours Worked
    // Calculate accurate total hours using the time calculator
    const totalHours = timeEntries
      .filter(e => this.isInDateRange(e.clockIn, periodStart, periodEnd))
      .reduce((sum, e) => {
        if (e.clockOut) {
          const result = TimeCalculator.calculateEntryHours(e);
          return sum + result.netHours;
        }
        return sum;
      }, 0);
    kpis.push({
      id: 'total-hours',
      name: 'Total Hours Worked',
      value: totalHours,
      target: workers.length * 8 * this.getWorkingDaysInRange(periodStart, periodEnd),
      unit: 'hours',
      trend: 'stable',
      changePercentage: 0,
      status: totalHours > 100 ? 'good' : 'warning'
    });

    // Average Attendance Rate
    const attendancePatterns = this.analyzeAttendancePatterns(workers, timeEntries, periodStart, periodEnd);
    const attendanceRate = attendancePatterns.length > 0 ? 
      (attendancePatterns.filter(p => p.attendanceStatus === 'present').length / attendancePatterns.length) * 100 : 0;
    kpis.push({
      id: 'attendance-rate',
      name: 'Attendance Rate',
      value: attendanceRate,
      target: 95,
      unit: '%',
      trend: attendanceRate > 95 ? 'up' : attendanceRate < 90 ? 'down' : 'stable',
      changePercentage: 0,
      status: attendanceRate > 95 ? 'good' : attendanceRate < 90 ? 'critical' : 'warning'
    });

    // Overtime Percentage
    // Calculate accurate overtime using the time calculator
    const totalOvertime = timeEntries
      .filter(e => this.isInDateRange(e.clockIn, periodStart, periodEnd))
      .reduce((sum, e) => {
        if (e.clockOut) {
          const result = TimeCalculator.calculateEntryHours(e);
          return sum + result.overtimeHours;
        }
        return sum;
      }, 0);
    const overtimePercentage = totalHours > 0 ? (totalOvertime / totalHours) * 100 : 0;
    kpis.push({
      id: 'overtime-percentage',
      name: 'Overtime Percentage',
      value: overtimePercentage,
      target: 10,
      unit: '%',
      trend: overtimePercentage < 10 ? 'up' : 'down',
      changePercentage: 0,
      status: overtimePercentage < 10 ? 'good' : overtimePercentage > 20 ? 'critical' : 'warning'
    });

    return kpis;
  }

  // Business Insights Generation
  static generateBusinessInsights(
    periodStart: string,
    periodEnd: string,
    workers: Worker[],
    timeEntries: TimeEntry[]
  ): BusinessInsights {
    // Top Performers
    const performanceMetrics = workers.map(worker => 
      this.calculatePerformanceMetrics(worker.id, periodStart, periodEnd, workers, timeEntries)
    );
    
    const topPerformers = performanceMetrics
      .filter(pm => pm.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5)
      .map(pm => {
        const worker = workers.find(w => w.id === pm.workerId)!;
        return {
          workerId: pm.workerId,
          workerName: worker.name,
          score: pm.totalScore,
          trend: pm.trends.direction
        };
      });

    // Attendance Issues
    const attendancePatterns = this.analyzeAttendancePatterns(workers, timeEntries, periodStart, periodEnd);
    const attendanceIssues = this.identifyAttendanceIssues(attendancePatterns, workers);

    // Cost Optimization Opportunities
    const costOptimization = this.identifyCostOptimization(workers, timeEntries, periodStart, periodEnd);

    // Productivity Alerts
    const productivityAlerts = this.identifyProductivityAlerts(workers, timeEntries, periodStart, periodEnd);

    return {
      topPerformers,
      attendanceIssues,
      costOptimization,
      productivityAlerts
    };
  }

  // Helper Methods
  private static isInDateRange(date: string, start: string, end: string): boolean {
    const entryDate = date.split('T')[0];
    return entryDate >= start && entryDate <= end;
  }

  private static isHoliday(date: string): boolean {
    // Simple holiday check - in real app, this would check against holiday calendar
    const month = new Date(date).getMonth() + 1;
    const day = new Date(date).getDate();
    
    // Christmas, New Year, etc.
    return (month === 12 && day === 25) || (month === 1 && day === 1);
  }

  private static groupEntriesByDate(entries: TimeEntry[]): Record<string, TimeEntry[]> {
    return entries.reduce((groups, entry) => {
      const date = entry.clockIn.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);
  }

  private static getWorkingDaysInRange(startDate: string, endDate: string): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  private static groupByWeek(entries: TimeEntry[]): Record<string, TimeEntry[]> {
    return entries.reduce((groups, entry) => {
      const date = new Date(entry.clockIn);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
      if (!groups[weekStart]) {
        groups[weekStart] = [];
      }
      groups[weekStart].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);
  }

  private static groupByMonth(entries: TimeEntry[]): Record<string, TimeEntry[]> {
    return entries.reduce((groups, entry) => {
      const date = new Date(entry.clockIn);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);
  }

  private static identifyAttendanceIssues(patterns: AttendancePattern[], workers: Worker[]) {
    const issues: { workerId: string; workerName: string; issueType: string; frequency: number; }[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.attendanceStatus === 'late') {
        const worker = workers.find(w => w.id === pattern.workerId);
        if (worker) {
          issues.push({
            workerId: pattern.workerId,
            workerName: worker.name,
            issueType: 'frequent-tardiness',
            frequency: 1
          });
        }
      }
    });

    // Aggregate by worker
    const aggregatedIssues: Record<string, { count: number; worker: Worker; issueType: string; }> = {};
    issues.forEach(issue => {
      const key = `${issue.workerId}-${issue.issueType}`;
      if (!aggregatedIssues[key]) {
        aggregatedIssues[key] = {
          count: 0,
          worker: workers.find(w => w.id === issue.workerId)!,
          issueType: issue.issueType
        };
      }
      aggregatedIssues[key].count++;
    });

    return Object.values(aggregatedIssues)
      .filter(item => item.count >= 3)
      .map(item => ({
        workerId: item.worker.id,
        workerName: item.worker.name,
        issueType: item.issueType,
        frequency: item.count
      }));
  }

  private static identifyCostOptimization(workers: Worker[], entries: TimeEntry[], start: string, end: string) {
    const optimizations: { opportunity: string; potentialSavings: number; impact: 'high' | 'medium' | 'low'; }[] = [];
    
    // High overtime analysis using accurate calculations
    const overtimeEntries = entries.filter(e => {
      if (!this.isInDateRange(e.clockIn, start, end)) return false;
      if (!e.clockOut) return false;
      
      const result = TimeCalculator.calculateEntryHours(e);
      return result.overtimeHours > 2;
    });
    
    if (overtimeEntries.length > entries.length * 0.3) {
      optimizations.push({
        opportunity: 'Reduce overtime through better workforce planning',
        potentialSavings: overtimeEntries.length * 50, // Estimate $50 per overtime hour saved
        impact: 'high' as const
      });
    }

    return optimizations;
  }

  private static identifyProductivityAlerts(workers: Worker[], entries: TimeEntry[], start: string, end: string) {
    const alerts: { department: string; metric: string; currentValue: number; expectedValue: number; severity: 'warning' | 'critical'; }[] = [];
    const departments = [...new Set(workers.map(w => w.department))];
    
    departments.forEach(dept => {
      const deptAnalytics = this.calculateDepartmentAnalytics(dept, start, end, workers, entries);
      if (deptAnalytics.productivityIndex < 80) {
        alerts.push({
          department: dept,
          metric: 'productivity-index',
          currentValue: deptAnalytics.productivityIndex,
          expectedValue: 100,
          severity: deptAnalytics.productivityIndex < 60 ? 'critical' as const : 'warning' as const
        });
      }
    });

    return alerts;
  }
}