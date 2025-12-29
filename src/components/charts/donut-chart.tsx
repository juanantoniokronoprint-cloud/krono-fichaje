import React from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color?: string; }[];
  title?: string;
  size?: number;
  innerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

export default function DonutChart({ 
  data, 
  title, 
  size = 300, 
  innerRadius = 0.5, 
  showLegend = true, 
  showLabels = true 
}: DonutChartProps) {
  const radius = size / 2 - 10;
  const innerR = radius * innerRadius;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];
  
  let currentAngle = -Math.PI / 2; // Start at top
  
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate path for the donut segment
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const x1 = size / 2 + radius * Math.cos(startAngle);
    const y1 = size / 2 + radius * Math.sin(startAngle);
    const x2 = size / 2 + radius * Math.cos(endAngle);
    const y2 = size / 2 + radius * Math.sin(endAngle);
    
    const x3 = size / 2 + innerR * Math.cos(endAngle);
    const y3 = size / 2 + innerR * Math.sin(endAngle);
    const x4 = size / 2 + innerR * Math.cos(startAngle);
    const y4 = size / 2 + innerR * Math.sin(startAngle);
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelRadius = (radius + innerR) / 2;
    const labelX = size / 2 + labelRadius * Math.cos(labelAngle);
    const labelY = size / 2 + labelRadius * Math.sin(labelAngle);
    
    const segment = {
      ...item,
      color: item.color || colors[index % colors.length],
      percentage,
      pathData,
      labelX,
      labelY,
      startAngle,
      endAngle
    };
    
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={size} height={size} className="drop-shadow-sm">
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  stroke="#fff"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>
                    {`${segment.label}: ${segment.value} (${segment.percentage.toFixed(1)}%)`}
                  </title>
                </path>
                
                {showLabels && segment.percentage > 5 && (
                  <text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-white pointer-events-none"
                  >
                    {segment.percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            ))}
            
            {/* Center text for donut chart */}
            {innerRadius > 0.3 && (
              <text
                x={size / 2}
                y={size / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-lg font-bold fill-gray-700"
              >
                {total.toFixed(0)}
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {segment.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {segment.value} ({segment.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}