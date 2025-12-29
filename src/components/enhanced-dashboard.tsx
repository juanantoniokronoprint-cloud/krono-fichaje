'use client';

import React, { useState, useEffect } from 'react';
import { Worker, TimeEntry, KPI, BusinessInsights, ChartData } from '../types';
import { AnalyticsEngine } from '../lib/analytics';
import { LineChart, BarChart, DonutChart, Heatmap } from './charts';
import DashboardStats from './dashboard-stats';

interface EnhancedDashboardProps {
  workers: Worker[];
  timeEntries: TimeEntry[];
}

export default function EnhancedDashboard({ workers, timeEntries }: EnhancedDashboardProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsights | null>(null);
  const [timeAnalytics, setTimeAnalytics] = useState<any>(null);
  const [attendanceHeatmap, setAttendanceHeatmap] = useState<any>(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  const [chartData, setChartData] = useState<{
    weeklyTrends: ChartData;
    departmentCosts: ChartData;
    attendanceBreakdown: ChartData;
    productivityTrends: ChartData;
  }>({
    weeklyTrends: { labels: [], datasets: [] },
    departmentCosts: { labels: [], datasets: [] },
    attendanceBreakdown: { labels: [], datasets: [] },
    productivityTrends: { labels: [], datasets: [] }
  });

  useEffect(() => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // Calculate all analytics
    const kpisData = AnalyticsEngine.calculateKPIs(startDate, endDate, workers, timeEntries);
    setKpis(kpisData);

    const insightsData = AnalyticsEngine.generateBusinessInsights(startDate, endDate, workers, timeEntries);
    setBusinessInsights(insightsData);

    const timeData = AnalyticsEngine.calculateTimeAnalytics(startDate, endDate, workers, timeEntries);
    setTimeAnalytics(timeData);

    // Generate attendance heatmap data
    generateAttendanceHeatmap(startDate, endDate);

    // Generate department analytics
    generateDepartmentAnalytics(startDate, endDate);

    // Generate chart data
    generateChartData(startDate, endDate);
  }, [workers, timeEntries, selectedPeriod]);

  const generateAttendanceHeatmap = (startDate: string, endDate: string) => {
    const attendancePatterns = AnalyticsEngine.analyzeAttendancePatterns(workers, timeEntries, startDate, endDate);
    
    const heatmapData: { [workerId: string]: { [date: string]: number } } = {};
    
    attendancePatterns.forEach(pattern => {
      if (!heatmapData[pattern.workerId]) {
        heatmapData[pattern.workerId] = {};
      }
      heatmapData[pattern.workerId][pattern.date] = pattern.punctualityScore;
    });

    setAttendanceHeatmap(heatmapData);
  };

  const generateDepartmentAnalytics = (startDate: string, endDate: string) => {
    const departments = [...new Set(workers.map(w => w.department))];
    const deptAnalytics = departments.map(dept =>
      AnalyticsEngine.calculateDepartmentAnalytics(dept, startDate, endDate, workers, timeEntries)
    );
    setDepartmentAnalytics(deptAnalytics);
  };

  const generateChartData = (startDate: string, endDate: string) => {
    // Weekly trends
    const timeData = AnalyticsEngine.calculateTimeAnalytics(startDate, endDate, workers, timeEntries);
    const weeklyTrendsData: ChartData = {
      labels: timeData.weeklyTrends.map(wt => wt.week),
      datasets: [{
        label: 'Total Hours',
        data: timeData.weeklyTrends.map(wt => wt.totalHours),
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8'
      }]
    };

    // Department costs
    const deptAnalytics = [...new Set(workers.map(w => w.department))]
      .map(dept => AnalyticsEngine.calculateDepartmentAnalytics(dept, startDate, endDate, workers, timeEntries));
    
    const departmentCostsData: ChartData = {
      labels: deptAnalytics.map(da => da.department),
      datasets: [{
        label: 'Cost per Hour',
        data: deptAnalytics.map(da => da.costPerHour),
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
        borderColor: ['#dc2626', '#d97706', '#059669', '#1d4ed8', '#7c3aed']
      }]
    };

    // Attendance breakdown
    const attendancePatterns = AnalyticsEngine.analyzeAttendancePatterns(workers, timeEntries, startDate, endDate);
    const statusCounts = attendancePatterns.reduce((acc, pattern) => {
      acc[pattern.attendanceStatus] = (acc[pattern.attendanceStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attendanceBreakdownData: ChartData = {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Days',
        data: Object.values(statusCounts),
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#6b7280']
      }]
    };

    // Productivity trends
    const performanceMetrics = workers.map(worker =>
      AnalyticsEngine.calculatePerformanceMetrics(worker.id, startDate, endDate, workers, timeEntries)
    );

    const productivityTrendsData: ChartData = {
      labels: workers.map(w => w.name.split(' ')[0]), // First name only for space
      datasets: [
        {
          label: 'Productivity',
          data: performanceMetrics.map(pm => pm.productivityScore),
          backgroundColor: '#10b981',
          borderColor: '#059669'
        },
        {
          label: 'Consistency',
          data: performanceMetrics.map(pm => pm.consistencyScore),
          backgroundColor: '#f59e0b',
          borderColor: '#d97706'
        }
      ]
    };

    setChartData({
      weeklyTrends: weeklyTrendsData,
      departmentCosts: departmentCostsData,
      attendanceBreakdown: attendanceBreakdownData,
      productivityTrends: productivityTrendsData
    });
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getKPITrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className={`p-6 rounded-lg border-2 ${getKPIStatusColor(kpi.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-80">{kpi.name}</h3>
              <span className="text-lg">{getKPITrendIcon(kpi.trend)}</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {kpi.value.toFixed(1)} {kpi.unit}
            </div>
            <div className="text-sm opacity-75">
              Target: {kpi.target} {kpi.unit}
            </div>
            <div className="text-xs opacity-60 mt-1">
              {kpi.changePercentage > 0 ? '+' : ''}{kpi.changePercentage.toFixed(1)}% from last period
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={chartData.weeklyTrends}
          title="Weekly Hours Trend"
          height={300}
        />
        
        <BarChart
          data={chartData.departmentCosts}
          title="Cost per Hour by Department"
          height={300}
        />
        
        <DonutChart
          data={chartData.attendanceBreakdown.labels.map((label, index) => ({
            label,
            value: chartData.attendanceBreakdown.datasets[0].data[index],
            color: chartData.attendanceBreakdown.datasets[0].backgroundColor?.[index] as string
          }))}
          title="Attendance Status Distribution"
          size={300}
        />
        
        <BarChart
          data={chartData.productivityTrends}
          title="Worker Performance Comparison"
          height={300}
        />
      </div>

      {/* Business Insights */}
      {businessInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performers</h3>
            <div className="space-y-3">
              {businessInsights.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.workerId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{performer.workerName}</div>
                      <div className="text-sm text-gray-600">Score: {performer.score.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="text-green-600">
                    {performer.trend === 'improving' ? '📈' : performer.trend === 'declining' ? '📉' : '➡️'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Optimization Opportunities */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cost Optimization</h3>
            <div className="space-y-3">
              {businessInsights.costOptimization.map((opp, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">{opp.opportunity}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opp.impact === 'high' ? 'bg-red-100 text-red-800' :
                      opp.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {opp.impact} impact
                    </span>
                  </div>
                  <div className="text-blue-700">
                    Potential savings: ${opp.potentialSavings.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Heatmap */}
      {attendanceHeatmap && (
        <div className="bg-white p-6 rounded-lg shadow">
          <Heatmap
            data={attendanceHeatmap}
            workers={workers.map(w => ({ id: w.id, name: w.name }))}
            title="Attendance Heatmap - Last 30 Days"
            cellSize={20}
            showValues={false}
          />
        </div>
      )}

      {/* Department Analytics Table */}
      {departmentAnalytics.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Hours/Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productivity Index
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost per Hour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turnover Risk
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentAnalytics.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.activeWorkers}/{dept.totalWorkers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.averageHoursPerWorker.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
                        dept.attendanceRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.productivityIndex >= 100 ? 'bg-green-100 text-green-800' :
                        dept.productivityIndex >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.productivityIndex.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${dept.costPerHour.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dept.turnoverRisk < 30 ? 'bg-green-100 text-green-800' :
                        dept.turnoverRisk < 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.turnoverRisk.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Time Analytics Summary */}
      {timeAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Analytics Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {timeAnalytics.totalHours.toFixed(0)}h
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {timeAnalytics.averageHoursPerDay.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Avg per Day</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {timeAnalytics.peakHours[0]?.hour || 0}:00
              </div>
              <div className="text-sm text-gray-600">Peak Hour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {timeAnalytics.weeklyTrends.length}
              </div>
              <div className="text-sm text-gray-600">Weeks Tracked</div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts and Notifications */}
      {businessInsights?.productivityAlerts && businessInsights.productivityAlerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Performance Alerts</h3>
          <div className="space-y-3">
            {businessInsights.productivityAlerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              } border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {alert.department} - {alert.metric.replace('-', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Current: {alert.currentValue.toFixed(1)} | Expected: {alert.expectedValue.toFixed(1)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}