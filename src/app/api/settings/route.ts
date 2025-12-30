/**
 * Settings API Routes
 * Handles CRUD operations for application settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler';

// GET /api/settings - Get all settings or a specific setting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await queryOne('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
      return NextResponse.json({ [key]: setting ? setting.setting_value : null });
    }

    const rows = await query('SELECT * FROM settings');
    const settings = rows.reduce((acc: any, row: any) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    // Ensure default admin PIN exists if not in DB
    if (!settings.admin_pin) {
      settings.admin_pin = '123456';
    }

    return NextResponse.json(settings);
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'get_settings' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    for (const [key, value] of Object.entries(body)) {
      await execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = ErrorHandler.handleError(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation: 'update_settings' }
    );
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}

