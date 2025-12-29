import React from 'react';
import { ChartData } from '../../types';

interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface LineChartProps {
  data: ChartData;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

export default function LineChart({ 
  data, 
  title, 
  height = 300, 
  showGrid = true, 
  showLegend = true 
}: LineChartProps) {
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find min and max values
  const allValues = data.datasets.flatMap((dataset: Dataset) => dataset.data);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;
  
  // Create scale functions
  const xScale = (index: number) => 
    padding.left + (index / (data.labels.length - 1)) * chartWidth;
  
  const yScale = (value: number) => 
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <svg width={chartWidth} height={height} className="w-full">
        {/* Grid lines */}
        {showGrid && (
          <g>
            {/* Horizontal grid lines */}
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
            
            {/* Vertical grid lines */}
            {data.labels.map((_: string, index: number) => {
              const x = xScale(index);
              return (
                <line
                  key={index}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Data lines */}
        {data.datasets.map((dataset: Dataset, datasetIndex: number) => (
          <g key={datasetIndex}>
            <path
              d={dataset.data
                .map((value: number, index: number) => 
                  `${index === 0 ? 'M' : 'L'} ${xScale(index)} ${yScale(value)}`
                )
                .join(' ')}
              fill="none"
              stroke={Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor || '#3b82f6'}
              strokeWidth={dataset.borderWidth || 2}
            />
            
            {/* Data points */}
            {dataset.data.map((value: number, index: number) => (
              <circle
                key={index}
                cx={xScale(index)}
                cy={yScale(value)}
                r="4"
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor || '#3b82f6'}
                stroke="#fff"
                strokeWidth="2"
              >
                <title>
                  {`${data.labels[index]}: ${value}${dataset.label ? ` (${dataset.label})` : ''}`}
                </title>
              </circle>
            ))}
          </g>
        ))}

        {/* X-axis labels */}
        {data.labels.map((label: string, index: number) => {
          const x = xScale(index);
          const angle = data.labels.length > 10 ? -45 : 0;
          return (
            <g key={index} transform={`rotate(${angle} ${x} ${height - padding.bottom + 15})`}>
              <text
                x={x}
                y={height - padding.bottom + 15}
                textAnchor={angle === 0 ? 'middle' : 'end'}
                className="text-xs fill-gray-500"
              >
                {label.length > 8 ? `${label.substring(0, 6)}...` : label}
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
                    ? dataset.backgroundColor[0] 
                    : dataset.backgroundColor || Array.isArray(dataset.borderColor)
                    ? dataset.borderColor[0] || '#3b82f6'
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