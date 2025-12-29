-- Schema para Sistema de Fichaje Krono
-- Base de datos: krono_fichaje

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS krono_fichaje CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE krono_fichaje;

-- Tabla de trabajadores (workers)
CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(255) PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  manager_id VARCHAR(255),
  skills JSON,
  employment_type ENUM('full-time', 'part-time', 'contractor', 'intern') NOT NULL DEFAULT 'full-time',
  location VARCHAR(255),
  cost_center VARCHAR(255),
  hire_date DATE NOT NULL,
  termination_date DATE,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  overtime_rate DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_number (employee_number),
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_is_active (is_active),
  INDEX idx_manager_id (manager_id),
  FOREIGN KEY (manager_id) REFERENCES workers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de registros de tiempo (time_entries)
CREATE TABLE IF NOT EXISTS time_entries (
  id VARCHAR(255) PRIMARY KEY,
  worker_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255),
  task_id VARCHAR(255),
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  break_start DATETIME,
  break_end DATETIME,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  ip_address VARCHAR(45),
  device_id VARCHAR(255),
  total_hours DECIMAL(10, 2),
  overtime DECIMAL(10, 2) DEFAULT 0.00,
  double_time DECIMAL(10, 2) DEFAULT 0.00,
  holiday_hours DECIMAL(10, 2) DEFAULT 0.00,
  sick_hours DECIMAL(10, 2) DEFAULT 0.00,
  remote_work BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(255),
  approval_date DATETIME,
  approval_status ENUM('pending', 'approved', 'rejected', 'auto-approved') NOT NULL DEFAULT 'pending',
  notes TEXT,
  tags JSON,
  billable BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_worker_id (worker_id),
  INDEX idx_clock_in (clock_in),
  INDEX idx_clock_out (clock_out),
  INDEX idx_approval_status (approval_status),
  INDEX idx_project_id (project_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES workers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

