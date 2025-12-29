'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  message,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className={`inline-block animate-spin rounded-full border-solid border-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Cargando...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
        <div className="text-center">
          {spinner}
          {message && (
            <p className="mt-4 text-sm text-gray-600">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {spinner}
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    );
  }

  return spinner;
}

/**
 * Inline spinner for buttons and small spaces
 */
export function InlineSpinner({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-3 h-3 border',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

