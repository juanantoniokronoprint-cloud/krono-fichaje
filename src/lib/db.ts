/**
 * Database Connection Module
 * Singleton connection pool for MySQL
 */

import mysql from 'mysql2/promise';
import { ErrorHandler, ErrorType, ErrorSeverity } from './error-handler';

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'krono_fichaje',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
};

// Create connection pool
let pool: mysql.Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      
      // Test connection
      pool.getConnection()
        .then((connection) => {
          console.log('Database connected successfully');
          connection.release();
        })
        .catch((error) => {
          ErrorHandler.handleError(
            error,
            ErrorType.UNKNOWN,
            ErrorSeverity.HIGH,
            { operation: 'db_connection', config: { ...dbConfig, password: '***' } }
          );
        });

      // Handle pool errors
      pool.on('error', (error) => {
        ErrorHandler.handleError(
          error,
          ErrorType.UNKNOWN,
          ErrorSeverity.HIGH,
          { operation: 'db_pool_error' }
        );
      });
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorType.UNKNOWN,
        ErrorSeverity.CRITICAL,
        { operation: 'db_pool_creation' }
      );
      throw error;
    }
  }
  return pool;
}

/**
 * Execute a query with error handling
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const pool = getPool();
    const [results] = await pool.execute(sql, params);
    return results as T[];
  } catch (error) {
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'db_query', sql, params }
    );
    throw error;
  }
}

/**
 * Execute a query that returns a single row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  try {
    const results = await query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'db_query_one', sql, params }
    );
    throw error;
  }
}

/**
 * Execute an INSERT query and return the insert ID
 */
export async function insert(
  sql: string,
  params?: any[]
): Promise<number> {
  try {
    const pool = getPool();
    const [result] = await pool.execute(sql, params) as any;
    return result.insertId;
  } catch (error) {
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'db_insert', sql, params }
    );
    throw error;
  }
}

/**
 * Execute an UPDATE or DELETE query and return affected rows
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<number> {
  try {
    const pool = getPool();
    const [result] = await pool.execute(sql, params) as any;
    return result.affectedRows;
  } catch (error) {
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'db_execute', sql, params }
    );
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      { operation: 'db_transaction' }
    );
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.LOW,
      { operation: 'db_health_check' }
    );
    return false;
  }
}

