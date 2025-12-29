'use client';

import React, { useState, useEffect } from 'react';
import { 
  Worker, 
  TimeEntry, 
  ReportConfig, 
  AdvancedFilter, 
  KPI,
  ChartData
} from '../../types';
import { AnalyticsEngine } from '../../lib/analytics';
import { LineChart, BarChart, DonutChart, Heatmap } from '../charts';

interface AdvancedReportBuilderProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
  onReportGenerated?: (report: any) => void;
}

export default function AdvancedReportBuilder({ 
  workers, 
  timeEntries, 
  onReportGenerated 
}: AdvancedReportBuilderProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: '',
    name: '',
    type: 'custom',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    },
    groupBy: 'day',
    metrics: [],
    format: 'both'
  });

  const [availableMetrics] = useState([
    { id: 'totalHours', name: 'Total Hours', category: 'time' },
    { id: 'overtimeHours', name: 'Overtime Hours', category: 'time' },
    { id: 'attendanceRate', name: 'Attendance Rate', category: 'attendance' },
    { id: 'productivityScore', name: 'Productivity Score', category: 'performance' },
    { id: 'totalPayroll', name: 'Total Payroll', category: 'financial' },
    { id: 'averageHoursPerWorker', name: 'Avg Hours per Worker', category: 'efficiency' },
    { id: 'turnoverRisk', name: 'Turnover Risk', category: 'hr' },
    { id: 'costPerHour', name: 'Cost per Hour', category: 'financial' }
  ]);

  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfigChange = (field: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value
      }
    }));
  };

  const handleMetricToggle = (metricId: string) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const { filters, groupBy, type } = reportConfig;
      const { start, end } = filters.dateRange!;

      let reportData: any = {
        config: reportConfig,
        generatedAt: new Date().toISOString(),
        dateRange: { start, end }
      };

      // Generate different report types
      switch (type) {
        case 'payroll':
          reportData.payrollData = await generatePayrollReport(filters, start, end);
          break;
        case 'attendance':
          reportData.attendanceData = await generateAttendanceReport(filters, start, end);
          break;
        case 'productivity':
          reportData.productivityData = await generateProductivityReport(filters, start, end);
          break;
        case 'cost-analysis':
          reportData.costData = await generateCostAnalysisReport(filters, start, end);
          break;
        default:
          reportData.customData = await generateCustomReport(filters, start, end);
      }

      // Generate KPIs
      reportData.kpis = AnalyticsEngine.calculateKPIs(start, end, workers, timeEntries);

      // Generate insights
      reportData.insights = AnalyticsEngine.generateBusinessInsights(start, end, workers, timeEntries);

      setGeneratedReport(reportData);
      onReportGenerated?.(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePayrollReport = async (filters: AdvancedFilter, start: string, end: string) => {
    const payrollData = workers.map(worker => 
      AnalyticsEngine.calculatePayrollData(worker.id, start, end, workers, timeEntries)
    );

    // Generate charts
    const chartData: ChartData = {
      labels: payrollData.map(p => workers.find(w => w.id === p.workerId)?.name || 'Unknown'),
      datasets: [{
        label: 'Total Pay',
        data: payrollData.map(p => p.totalPay),
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8'
      }]
    };

    return {
      payrollDetails: payrollData,
      totalPayroll: payrollData.reduce((sum, p) => sum + p.totalPay, 0),
      totalOvertime: payrollData.reduce((sum, p) => sum + p.overtimeHours, 0),
      chartData
    };
  };

  const generateAttendanceReport = async (filters: AdvancedFilter, start: string, end: string) => {
    const attendancePatterns = AnalyticsEngine.analyzeAttendancePatterns(workers, timeEntries, start, end);

    // Group by worker
    const workerAttendance = workers.map(worker => {
      const workerPatterns = attendancePatterns.filter(p => p.workerId === worker.id);
      const presentDays = workerPatterns.filter(p => p.attendanceStatus === 'present').length;
      const attendanceRate = workerPatterns.length > 0 ? (presentDays / workerPatterns.length) * 100 : 0;

      return {
        workerId: worker.id,
        workerName: worker.name,
        attendanceRate,
        totalDays: workerPatterns.length,
        presentDays,
        punctualityScore: workerPatterns.reduce((sum, p) => sum + p.punctualityScore, 0) / workerPatterns.length || 0
      };
    });

    return {
      workerAttendance,
      overallAttendanceRate: attendancePatterns.length > 0 ? 
        (attendancePatterns.filter(p => p.attendanceStatus === 'present').length / attendancePatterns.length) * 100 : 0
    };
  };

  const generateProductivityReport = async (filters: AdvancedFilter, start: string, end: string) => {
    const performanceMetrics = workers.map(worker =>
      AnalyticsEngine.calculatePerformanceMetrics(worker.id, start, end, workers, timeEntries)
    );

    const chartData: ChartData = {
      labels: performanceMetrics.map(pm => workers.find(w => w.id === pm.workerId)?.name || 'Unknown'),
      datasets: [
        {
          label: 'Productivity Score',
          data: performanceMetrics.map(pm => pm.productivityScore),
          backgroundColor: '#10b981',
          borderColor: '#059669'
        },
        {
          label: 'Consistency Score',
          data: performanceMetrics.map(pm => pm.consistencyScore),
          backgroundColor: '#f59e0b',
          borderColor: '#d97706'
        }
      ]
    };

    return {
      performanceMetrics,
      averageProductivity: performanceMetrics.reduce((sum, pm) => sum + pm.productivityScore, 0) / performanceMetrics.length || 0,
      chartData
    };
  };

  const generateCostAnalysisReport = async (filters: AdvancedFilter, start: string, end: string) => {
    const departments = [...new Set(workers.map(w => w.department))];
    const departmentAnalytics = departments.map(dept =>
      AnalyticsEngine.calculateDepartmentAnalytics(dept, start, end, workers, timeEntries)
    );

    const chartData: ChartData = {
      labels: departmentAnalytics.map(da => da.department),
      datasets: [
        {
          label: 'Cost per Hour',
          data: departmentAnalytics.map(da => da.costPerHour),
          backgroundColor: '#ef4444',
          borderColor: '#dc2626'
        }
      ]
    };

    return {
      departmentAnalytics,
      totalCost: departmentAnalytics.reduce((sum, da) => sum + (da.costPerHour * da.averageHoursPerWorker * da.totalWorkers), 0),
      chartData
    };
  };

  const generateCustomReport = async (filters: AdvancedFilter, start: string, end: string) => {
    const timeAnalytics = AnalyticsEngine.calculateTimeAnalytics(start, end, workers, timeEntries);
    
    const chartData: ChartData = {
      labels: timeAnalytics.weeklyTrends.map(wt => wt.week),
      datasets: [{
        label: 'Total Hours',
        data: timeAnalytics.weeklyTrends.map(wt => wt.totalHours),
        backgroundColor: '#8b5cf6',
        borderColor: '#7c3aed'
      }]
    };

    return {
      timeAnalytics,
      chartData
    };
  };

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    if (!generatedReport) return;

    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
  };

  const exportToCSV = () => {
    if (!generatedReport) return;

    const csvData = [];
    csvData.push(['Report Generated', new Date().toLocaleString()]);
    csvData.push(['Date Range', `${generatedReport.dateRange.start} to ${generatedReport.dateRange.end}`]);
    csvData.push([]);

    if (generatedReport.payrollData) {
      csvData.push(['Payroll Report']);
      csvData.push(['Worker', 'Regular Hours', 'Overtime Hours', 'Total Pay', 'Net Pay']);
      generatedReport.payrollData.payrollDetails.forEach((p: any) => {
        const worker = workers.find(w => w.id === p.workerId);
        csvData.push([
          worker?.name || 'Unknown',
          p.regularHours.toFixed(2),
          p.overtimeHours.toFixed(2),
          p.totalPay.toFixed(2),
          p.netPay.toFixed(2)
        ]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For now, we'll use CSV format as Excel export would require a library
    exportToCSV();
  };

  const exportToPDF = () => {
    // For now, we'll use browser's print functionality
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Name
              </label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportConfig.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="payroll">Payroll Report</option>
                <option value="attendance">Attendance Report</option>
                <option value="productivity">Productivity Report</option>
                <option value="cost-analysis">Cost Analysis</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By
              </label>
              <select
                value={reportConfig.groupBy}
                onChange={(e) => handleConfigChange('groupBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="department">Department</option>
                <option value="worker">Worker</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={reportConfig.filters.dateRange?.start}
                onChange={(e) => handleFilterChange('dateRange', { 
                  ...reportConfig.filters.dateRange, 
                  start: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={reportConfig.filters.dateRange?.end}
                onChange={(e) => handleFilterChange('dateRange', { 
                  ...reportConfig.filters.dateRange, 
                  end: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={reportConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="table">Table Only</option>
                <option value="chart">Charts Only</option>
                <option value="both">Table and Charts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metrics to Include
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableMetrics.map((metric) => (
              <label key={metric.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes(metric.id)}
                  onChange={() => handleMetricToggle(metric.id)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{metric.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={generateReport}
            disabled={isGenerating || !reportConfig.name}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Generated Report */}
      {generatedReport && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{reportConfig.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('csv')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Export Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* KPIs */}
            {generatedReport.kpis && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {generatedReport.kpis.slice(0, 4).map((kpi: KPI) => (
                  <div key={kpi.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">{kpi.name}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {kpi.value.toFixed(1)} {kpi.unit}
                    </div>
                    <div className={`text-xs ${
                      kpi.status === 'good' ? 'text-green-600' :
                      kpi.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Target: {kpi.target} {kpi.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts */}
            {(reportConfig.format === 'chart' || reportConfig.format === 'both') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generatedReport.payrollData?.chartData && (
                  <BarChart
                    data={generatedReport.payrollData.chartData}
                    title="Payroll by Worker"
                  />
                )}
                
                {generatedReport.productivityData?.chartData && (
                  <BarChart
                    data={generatedReport.productivityData.chartData}
                    title="Performance Metrics"
                  />
                )}
                
                {generatedReport.costData?.chartData && (
                  <BarChart
                    data={generatedReport.costData.chartData}
                    title="Cost per Hour by Department"
                  />
                )}
                
                {generatedReport.customData?.chartData && (
                  <LineChart
                    data={generatedReport.customData.chartData}
                    title="Hours Trend"
                  />
                )}
              </div>
            )}

            {/* Data Tables */}
            {(reportConfig.format === 'table' || reportConfig.format === 'both') && (
              <div className="mt-6">
                {generatedReport.payrollData && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Payroll Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regular Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {generatedReport.payrollData.payrollDetails.map((p: any, index: number) => {
                            const worker = workers.find(w => w.id === p.workerId);
                            return (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {worker?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {p.regularHours.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {p.overtimeHours.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${p.totalPay.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Business Insights */}
            {generatedReport.insights && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Business Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Performers */}
                  {generatedReport.insights.topPerformers.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Top Performers</h5>
                      <ul className="text-sm text-green-700">
                        {generatedReport.insights.topPerformers.slice(0, 3).map((performer: any, index: number) => (
                          <li key={index}>
                            {performer.workerName} - Score: {performer.score.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cost Optimization */}
                  {generatedReport.insights.costOptimization.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Cost Optimization</h5>
                      <ul className="text-sm text-blue-700">
                        {generatedReport.insights.costOptimization.map((opp: any, index: number) => (
                          <li key={index}>
                            {opp.opportunity} - Potential Savings: ${opp.potentialSavings.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}