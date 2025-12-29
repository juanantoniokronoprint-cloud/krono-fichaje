import React from 'react';

interface HeatmapData {
  [workerId: string]: {
    [date: string]: number; // 0-100 representing attendance score
  };
}

interface WorkerInfo {
  id: string;
  name: string;
}

interface HeatmapProps {
  data: HeatmapData;
  workers: WorkerInfo[];
  title?: string;
  cellSize?: number;
  showValues?: boolean;
}

export default function Heatmap({ 
  data, 
  workers, 
  title, 
  cellSize = 20, 
  showValues = false 
}: HeatmapProps) {
  // Get all unique dates and sort them
  const allDates = new Set<string>();
  Object.values(data).forEach(workerData => {
    Object.keys(workerData).forEach(date => allDates.add(date));
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  // Color scale for attendance scores
  const getColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // Green - Excellent
    if (score >= 80) return '#84cc16'; // Light green - Good
    if (score >= 70) return '#f59e0b'; // Yellow - Fair
    if (score >= 60) return '#f97316'; // Orange - Poor
    return '#ef4444'; // Red - Very poor/Absent
  };
  
  const getTextColor = (score: number): string => {
    return score >= 70 ? '#ffffff' : '#000000';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with dates */}
          <div className="flex mb-2">
            <div className="w-32 flex-shrink-0"></div> {/* Worker name column */}
            {sortedDates.map((date, index) => {
              const dateObj = new Date(date);
              const dayOfWeek = dateObj.toLocaleDateString('en', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              return (
                <div
                  key={date}
                  className="flex flex-col items-center text-xs text-gray-600 px-1"
                  style={{ width: cellSize }}
                >
                  <span className="font-medium">{dayOfWeek}</span>
                  <span>{dayNum}</span>
                </div>
              );
            })}
          </div>
          
          {/* Heatmap grid */}
          <div className="space-y-1">
            {workers.map((worker) => {
              const workerData = data[worker.id] || {};
              return (
                <div key={worker.id} className="flex items-center">
                  {/* Worker name */}
                  <div className="w-32 flex-shrink-0 pr-2">
                    <span className="text-sm font-medium text-gray-900 truncate block">
                      {worker.name.length > 12 ? `${worker.name.substring(0, 10)}...` : worker.name}
                    </span>
                  </div>
                  
                  {/* Attendance cells */}
                  <div className="flex">
                    {sortedDates.map((date) => {
                      const score = workerData[date] || 0;
                      const color = getColor(score);
                      const textColor = getTextColor(score);
                      
                      return (
                        <div
                          key={date}
                          className="flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                          style={{
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: color,
                          }}
                          title={`${worker.name} - ${new Date(date).toLocaleDateString()}: ${score}%`}
                        >
                          {showValues && score > 0 && (
                            <span 
                              className="text-xs font-medium"
                              style={{ color: textColor }}
                            >
                              {score}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Attendance:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-xs text-gray-600">90%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }}></div>
                <span className="text-xs text-gray-600">80%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-xs text-gray-600">70%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
                <span className="text-xs text-gray-600">60%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-xs text-gray-600">&lt;60%</span>
              </div>
            </div>
            
            {showValues && (
              <div className="text-xs text-gray-500">
                Click cells for details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}