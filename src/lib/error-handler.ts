/**
 * Centralized Error Handling System
 * Provides structured error handling with categorization, logging, and user-friendly messages
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string; // User-friendly message in Spanish
  code?: string;
  originalError?: Error | unknown;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface ErrorLogEntry extends AppError {
  id: string;
  stack?: string;
}

const ERROR_LOG_KEY = 'time-tracking-error-logs';
const MAX_ERROR_LOGS = 100;

/**
 * Custom error classes for different error types
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Centralized Error Handler
 */
export class ErrorHandler {
  private static errorLogs: ErrorLogEntry[] = [];

  /**
   * Initialize error handler and load logs from storage
   */
  static init(): void {
    try {
      const stored = localStorage.getItem(ERROR_LOG_KEY);
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load error logs from storage', error);
      this.errorLogs = [];
    }
  }

  /**
   * Handle and log an error
   */
  static handleError(
    error: Error | unknown,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, unknown>
  ): AppError {
    const appError = this.createAppError(error, type, severity, context);
    this.logError(appError);
    return appError;
  }

  /**
   * Create an AppError from various error types
   */
  private static createAppError(
    error: Error | unknown,
    type: ErrorType,
    severity: ErrorSeverity,
    context?: Record<string, unknown>
  ): AppError {
    let message = 'An unknown error occurred';
    let userMessage = 'Ha ocurrido un error inesperado';
    let code: string | undefined;

    // Handle custom error classes
    if (error instanceof ValidationError) {
      message = error.message;
      userMessage = error.userMessage;
      code = error.code;
      type = ErrorType.VALIDATION;
    } else if (error instanceof StorageError) {
      message = error.message;
      userMessage = error.userMessage;
      code = error.code;
      type = ErrorType.STORAGE;
    } else if (error instanceof NetworkError) {
      message = error.message;
      userMessage = error.userMessage;
      code = error.code;
      type = ErrorType.NETWORK;
    } else if (error instanceof BusinessLogicError) {
      message = error.message;
      userMessage = error.userMessage;
      code = error.code;
      type = ErrorType.BUSINESS_LOGIC;
    } else if (error instanceof PermissionError) {
      message = error.message;
      userMessage = error.userMessage;
      code = error.code;
      type = ErrorType.PERMISSION;
    } else if (error instanceof Error) {
      message = error.message;
      userMessage = this.getUserFriendlyMessage(error, type);
    } else if (typeof error === 'string') {
      message = error;
      userMessage = this.getUserFriendlyMessage(new Error(error), type);
    }

    return {
      type,
      severity,
      message,
      userMessage,
      code,
      originalError: error,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  /**
   * Get user-friendly message in Spanish based on error type
   */
  private static getUserFriendlyMessage(error: Error, type: ErrorType): string {
    const errorMessage = error.message.toLowerCase();

    // Storage errors
    if (type === ErrorType.STORAGE) {
      if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
        return 'El almacenamiento está lleno. Por favor, contacta al administrador.';
      }
      if (errorMessage.includes('parse') || errorMessage.includes('json')) {
        return 'Error al leer los datos. Los datos pueden estar corruptos.';
      }
      return 'Error al guardar o cargar datos. Por favor, intenta nuevamente.';
    }

    // Network errors
    if (type === ErrorType.NETWORK) {
      if (errorMessage.includes('timeout')) {
        return 'La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.';
      }
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return 'Error de conexión. Verifica tu conexión a internet.';
      }
      return 'Error de comunicación. Por favor, intenta nuevamente.';
    }

    // Validation errors
    if (type === ErrorType.VALIDATION) {
      return error.message || 'Los datos ingresados no son válidos. Por favor, verifica la información.';
    }

    // Business logic errors
    if (type === ErrorType.BUSINESS_LOGIC) {
      return error.message || 'No se puede completar esta operación. Por favor, verifica el estado del sistema.';
    }

    // Permission errors
    if (type === ErrorType.PERMISSION) {
      return 'No tienes permisos para realizar esta acción.';
    }

    // Default
    return 'Ha ocurrido un error. Por favor, intenta nuevamente o contacta al administrador.';
  }

  /**
   * Log error to console and storage
   */
  private static logError(error: AppError): void {
    const logEntry: ErrorLogEntry = {
      ...error,
      id: this.generateLogId(),
      stack: error.originalError instanceof Error ? error.originalError.stack : undefined,
    };

    // Console logging based on severity
    const consoleMethod = this.getConsoleMethod(error.severity);
    consoleMethod(`[${error.type}] ${error.message}`, {
      severity: error.severity,
      userMessage: error.userMessage,
      context: error.context,
      stack: logEntry.stack,
    });

    // Store in memory
    this.errorLogs.push(logEntry);

    // Keep only last MAX_ERROR_LOGS
    if (this.errorLogs.length > MAX_ERROR_LOGS) {
      this.errorLogs = this.errorLogs.slice(-MAX_ERROR_LOGS);
    }

    // Persist to localStorage (only for high/critical errors)
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      try {
        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this.errorLogs));
      } catch (storageError) {
        // If we can't save logs, don't fail silently but log to console
        console.warn('Failed to save error logs to storage', storageError);
      }
    }
  }

  /**
   * Get console method based on severity
   */
  private static getConsoleMethod(severity: ErrorSeverity): typeof console.error {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
      default:
        return console.info;
    }
  }

  /**
   * Generate unique log ID
   */
  private static generateLogId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error logs
   */
  static getErrorLogs(limit?: number): ErrorLogEntry[] {
    const logs = [...this.errorLogs].reverse(); // Most recent first
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Clear error logs
   */
  static clearLogs(): void {
    this.errorLogs = [];
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.warn('Failed to clear error logs from storage', error);
    }
  }

  /**
   * Check if storage is available and has space
   */
  static checkStorageAvailability(): { available: boolean; message?: string } {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return { available: true };
    } catch (error) {
      return {
        available: false,
        message: 'El almacenamiento local no está disponible o está lleno',
      };
    }
  }
}

// Initialize error handler on module load
ErrorHandler.init();

