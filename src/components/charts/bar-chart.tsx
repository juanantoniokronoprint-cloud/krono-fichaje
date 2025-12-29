import React from 'react';
import { ChartData } from '../../types';

interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface BarChartProps {
  data: ChartData;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
}

export default function BarChart({ 
  data, 
  title, 
  height = 300, 
  showGrid = true, 
  showLegend = true,
  horizontal = false
}: BarChartProps) {
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find min and max values
  const allValues = data.datasets.flatMap((dataset: Dataset) => dataset.data);
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;
  
  // Create scale functions
  const barWidth = chartWidth / data.labels.length / data.datasets.length * 0.8;
  const barSpacing = chartWidth / data.labels.length;
  
  const getBarX = (datasetIndex: number, labelIndex: number) => 
    padding.left + labelIndex * barSpacing + (datasetIndex * barWidth) + (barSpacing - barWidth * data.datasets.length) / 2;
  
  const getBarY = (value: number) => 
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const getHorizontalBarX = (value: number) => 
    padding.left + ((value - minValue) / valueRange) * chartWidth;
  
  const getHorizontalBarY = (datasetIndex: number, labelIndex: number) =>
    padding.top + labelIndex * barSpacing + (datasetIndex * barHeight) + (barSpacing - barHeight * data.datasets.length) / 2;
  
  const barHeight = chartHeight / data.labels.length / data.datasets.length * 0.8;

  if (horizontal) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <svg width={chartWidth} height={height} className="w-full">
          {/* Grid lines */}
          {showGrid && (
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const x = padding.left + chartWidth * ratio;
                const value = minValue + (valueRange * ratio);
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={height - padding.bottom + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {value.toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Data bars */}
          {data.datasets.map((dataset: Dataset, datasetIndex: number) => (
            <g key={datasetIndex}>
              {dataset.data.map((value: number, labelIndex: number) => (
                <rect
                  key={labelIndex}
                  x={padding.left}
                  y={getHorizontalBarY(datasetIndex, labelIndex)}
                  width={getHorizontalBarX(value) - padding.left}
                  height={barHeight}
                  fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[datasetIndex] || '#3b82f6' : dataset.backgroundColor || '#3b82f6'}
                  stroke={Array.isArray(dataset.borderColor) ? (dataset.borderColor?.[datasetIndex] || '#3b82f6') : dataset.borderColor || '#3b82f6'}
                  strokeWidth={dataset.borderWidth || 1}
                >
                  <title>
                    {`${data.labels[labelIndex]}: ${value}${dataset.label ? ` (${dataset.label})` : ''}`}
                  </title>
                </rect>
              ))}
            </g>
          ))}

          {/* Y-axis labels */}
          {data.labels.map((label: string, index: number) => {
            const y = padding.top + index * barSpacing + chartHeight / data.labels.length / 2;
            return (
              <text
                key={index}
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                className="text-xs fill-gray-500"
                dominantBaseline="middle"
              >
                {label.length > 12 ? `${label.substring(0, 10)}...` : label}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        {showLegend && data.datasets.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {data.datasets.map((dataset: Dataset, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ 
                    backgroundColor: Array.isArray(dataset.backgroundColor) 
                      ? dataset.backgroundColor[index] || '#3b82f6'
                      : dataset.backgroundColor || Array.isArray(dataset.borderColor)
                      ? (dataset.borderColor?.[index] || '#3b82f6')
                      : dataset.borderColor || '#3b82f6' 
                  }}
                />
                <span className="text-sm text-gray-600">{dataset.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <svg width={chartWidth} height={height} className="w-full">
        {/* Grid lines */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + chartHeight * ratio;
              const value = maxValue - (valueRange * ratio);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {value.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Data bars */}
        {data.datasets.map((dataset: Dataset, datasetIndex: number) => (
          <g key={datasetIndex}>
            {dataset.data.map((value: number, labelIndex: number) => (
              <rect
                key={labelIndex}
                x={getBarX(datasetIndex, labelIndex)}
                y={Math.min(getBarY(value), getBarY(0))}
                width={barWidth}
                height={Math.abs(getBarY(value) - getBarY(0))}
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[datasetIndex] || '#3b82f6' : dataset.backgroundColor || '#3b82f6'}
                stroke={Array.isArray(dataset.borderColor) ? (dataset.borderColor?.[datasetIndex] || '#3b82f6') : dataset.borderColor || '#3b82f6'}
                strokeWidth={dataset.borderWidth || 1}
              >
                <title>
                  {`${data.labels[labelIndex]}: ${value}${dataset.label ? ` (${dataset.label})` : ''}`}
                </title>
              </rect>
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {data.labels.map((label: string, index: number) => {
          const x = padding.left + index * barSpacing + barSpacing / 2;
          const angle = data.labels.length > 8 ? -45 : 0;
          return (
            <g key={index} transform={`rotate(${angle} ${x} ${height - padding.bottom + 15})`}>
              <text
                x={x}
                y={height - padding.bottom + 15}
                textAnchor={angle === 0 ? 'middle' : 'end'}
                className="text-xs fill-gray-500"
              >
                {label.length > 10 ? `${label.substring(0, 8)}...` : label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && data.datasets.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {data.datasets.map((dataset: Dataset, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ 
                  backgroundColor: Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor[index] || '#3b82f6'
                    : dataset.backgroundColor || Array.isArray(dataset.borderColor)
                    ? (dataset.borderColor?.[index] || '#3b82f6')
                    : dataset.borderColor || '#3b82f6' 
                }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}