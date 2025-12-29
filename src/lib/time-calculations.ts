import { TimeEntry, BreakEntry } from '../types';

export interface TimeCalculationResult {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  breakHours: number;
  netHours: number;
  payRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
}

export interface ShiftPolicy {
  standardHoursPerDay: number;
  standardHoursPerWeek: number;
  overtimeAfterHoursPerDay: number;
  overtimeAfterHoursPerWeek: number;
  doubleTimeAfterHoursPerDay: number;
  minimumShiftHours: number;
  breakDeductionAfterHours: number;
  breakDurationMinutes: number;
  roundToNearestMinutes: number;
}

// Default Spanish labor law compliant policy
export const DEFAULT_SHIFT_POLICY: ShiftPolicy = {
  standardHoursPerDay: 8,
  standardHoursPerWeek: 40,
  overtimeAfterHoursPerDay: 8, // Daily overtime after 8 hours
  overtimeAfterHoursPerWeek: 40, // Weekly overtime after 40 hours
  doubleTimeAfterHoursPerDay: 12, // Double time after 12 hours in a day
  minimumShiftHours: 2, // Minimum shift duration
  breakDeductionAfterHours: 4, // Break required after 4 hours
  breakDurationMinutes: 30, // Standard break duration
  roundToNearestMinutes: 15, // Round to nearest 15 minutes
};

export class TimeCalculator {
  /**
   * Calculate hours for a single time entry with proper break handling
   */
  static calculateEntryHours(
    entry: TimeEntry, 
    policy: ShiftPolicy = DEFAULT_SHIFT_POLICY
  ): TimeCalculationResult {
    if (!entry.clockOut) {
      throw new Error('Cannot calculate hours for active time entry');
    }

    const clockIn = new Date(entry.clockIn);
    const clockOut = new Date(entry.clockOut);
    
    // Calculate gross hours
    const grossHours = this.calculateGrossHours(clockIn, clockOut);
    
    // Apply minimum shift rule
    const adjustedHours = Math.max(grossHours, policy.minimumShiftHours);
    
    // Calculate break deduction
    const breakHours = this.calculateBreakDeduction(adjustedHours, policy);
    const netHours = Math.max(0, adjustedHours - breakHours);
    
    // Calculate different pay rates
    const rates = this.calculatePayRates(entry, policy);
    
    // Calculate overtime based on daily and weekly rules
    const overtimeResult = this.calculateOvertime(netHours, policy);
    
    return {
      totalHours: grossHours,
      regularHours: overtimeResult.regularHours,
      overtimeHours: overtimeResult.overtimeHours,
      doubleTimeHours: overtimeResult.doubleTimeHours,
      breakHours,
      netHours,
      payRate: rates.regularRate,
      overtimeRate: rates.overtimeRate,
      doubleTimeRate: rates.doubleTimeRate,
    };
  }

  /**
   * Calculate weekly overtime considering multiple entries
   */
  static calculateWeeklyHours(
    entries: TimeEntry[],
    policy: ShiftPolicy = DEFAULT_SHIFT_POLICY
  ): {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    weeklyTotal: number;
  } {
    // Sort entries by date
    const sortedEntries = entries
      .filter(e => e.clockOut)
      .sort((a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime());

    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    // Group by week
    const weeklyTotals = this.groupEntriesByWeek(sortedEntries, policy);

    for (const weekData of weeklyTotals) {
      let weekRegular = 0;
      let weekOvertime = 0;
      let weekDoubleTime = 0;

      // Calculate daily hours first
      for (const dayData of weekData.days) {
        const dayResult = this.calculateEntryHours(dayData.entry, policy);
        
        // Apply weekly overtime rules
        const remainingRegular = Math.max(0, policy.standardHoursPerWeek - weekRegular);
        const availableRegular = Math.min(dayResult.netHours, remainingRegular);
        
        weekRegular += availableRegular;
        const remainingHours = dayResult.netHours - availableRegular;
        
        if (remainingHours > 0) {
          const dailyOvertime = Math.min(remainingHours, dayResult.overtimeHours);
          weekOvertime += dailyOvertime;
          weekDoubleTime += Math.max(0, remainingHours - dailyOvertime);
        }
      }

      regularHours += weekRegular;
      overtimeHours += weekOvertime;
      doubleTimeHours += weekDoubleTime;
      totalHours += weekData.totalHours;
    }

    return {
      totalHours,
      regularHours,
      overtimeHours,
      doubleTimeHours,
      weeklyTotal: regularHours + overtimeHours + doubleTimeHours
    };
  }

  /**
   * Calculate payroll for a worker
   */
  static calculatePayroll(
    workerId: string,
    entries: TimeEntry[],
    hourlyRate: number,
    policy: ShiftPolicy = DEFAULT_SHIFT_POLICY
  ): {
    regularPay: number;
    overtimePay: number;
    doubleTimePay: number;
    totalPay: number;
    hoursBreakdown: {
      regularHours: number;
      overtimeHours: number;
      doubleTimeHours: number;
    };
  } {
    const workerEntries = entries.filter(e => e.workerId === workerId);
    const weeklyResult = this.calculateWeeklyHours(workerEntries, policy);

    const regularPay = weeklyResult.regularHours * hourlyRate;
    const overtimePay = weeklyResult.overtimeHours * (hourlyRate * 1.5);
    const doubleTimePay = weeklyResult.doubleTimeHours * (hourlyRate * 2.0);
    const totalPay = regularPay + overtimePay + doubleTimePay;

    return {
      regularPay,
      overtimePay,
      doubleTimePay,
      totalPay,
      hoursBreakdown: {
        regularHours: weeklyResult.regularHours,
        overtimeHours: weeklyResult.overtimeHours,
        doubleTimeHours: weeklyResult.doubleTimeHours,
      }
    };
  }

  // Private calculation methods

  private static calculateGrossHours(clockIn: Date, clockOut: Date): number {
    const diffMs = clockOut.getTime() - clockIn.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return this.roundToNearest(hours, DEFAULT_SHIFT_POLICY.roundToNearestMinutes / 60);
  }

  private static calculateBreakDeduction(hours: number, policy: ShiftPolicy): number {
    if (hours < policy.breakDeductionAfterHours) {
      return 0;
    }
    
    // Deduct break time for shifts longer than breakDeductionAfterHours
    return policy.breakDurationMinutes / 60;
  }

  private static calculatePayRates(entry: TimeEntry, policy: ShiftPolicy): {
    regularRate: number;
    overtimeRate: number;
    doubleTimeRate: number;
  } {
    const baseRate = entry.hourlyRate || 0;
    
    // Check for shift differentials (night shift, weekend, etc.)
    const shiftMultiplier = this.getShiftMultiplier(entry.clockIn);
    
    return {
      regularRate: baseRate * shiftMultiplier,
      overtimeRate: baseRate * 1.5 * shiftMultiplier,
      doubleTimeRate: baseRate * 2.0 * shiftMultiplier,
    };
  }

  private static getShiftMultiplier(clockIn: string): number {
    const date = new Date(clockIn);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Weekend premium (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.25; // 25% weekend premium
    }

    // Night shift premium (8 PM to 6 AM)
    if (hour >= 20 || hour < 6) {
      return 1.15; // 15% night shift premium
    }

    return 1.0; // Regular rate
  }

  private static calculateOvertime(hours: number, policy: ShiftPolicy): {
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
  } {
    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    if (hours <= policy.overtimeAfterHoursPerDay) {
      regularHours = hours;
    } else if (hours <= policy.doubleTimeAfterHoursPerDay) {
      regularHours = policy.overtimeAfterHoursPerDay;
      overtimeHours = hours - policy.overtimeAfterHoursPerDay;
    } else {
      regularHours = policy.overtimeAfterHoursPerDay;
      overtimeHours = policy.doubleTimeAfterHoursPerDay - policy.overtimeAfterHoursPerDay;
      doubleTimeHours = hours - policy.doubleTimeAfterHoursPerDay;
    }

    return { regularHours, overtimeHours, doubleTimeHours };
  }

  private static groupEntriesByWeek(entries: TimeEntry[], policy: ShiftPolicy): Array<{
    week: string;
    totalHours: number;
    days: Array<{ date: string; entry: TimeEntry }>;
  }> {
    const weeks = new Map<string, Array<{ date: string; entry: TimeEntry }>>();

    for (const entry of entries) {
      const weekKey = this.getWeekKey(entry.clockIn);
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, []);
      }
      weeks.get(weekKey)!.push({
        date: entry.clockIn.split('T')[0],
        entry
      });
    }

    return Array.from(weeks.entries()).map(([week, days]) => ({
      week,
      totalHours: days.reduce((sum, day) => sum + this.calculateGrossHours(
        new Date(day.entry.clockIn), 
        new Date(day.entry.clockOut!)
      ), 0),
      days
    }));
  }

  private static getWeekKey(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private static roundToNearest(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest;
  }
}