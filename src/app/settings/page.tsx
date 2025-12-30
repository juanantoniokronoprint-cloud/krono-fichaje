'use client';

import { useState, useEffect } from 'react';
import { SettingsStorage } from '../../lib/api-storage';
import PinAuthGuard from '../../components/pin-auth-guard';
import { useNotificationContext } from '../../components/notification-provider';

function SettingsPageContent() {
  const [adminPin, setAdminPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSubmitting] = useState(false);
  const notifications = useNotificationContext();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await SettingsStorage.getAll();
      if (settings.admin_pin) {
        setAdminPin(settings.admin_pin);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      notifications.showError('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPin.trim() || adminPin.length < 4) {
      notifications.showWarning('El PIN debe tener al menos 4 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await SettingsStorage.update({ admin_pin: adminPin.trim() });
      notifications.showSuccess('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      notifications.showError('Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Configuración del Sistema</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="adminPin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN de Administrador
              </label>
              <input
                type="password"
                id="adminPin"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="******"
              />
              <p className="mt-2 text-xs text-gray-500">
                Este PIN se utiliza para acceder a todas las áreas administrativas.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <PinAuthGuard adminOnly={true}>
      <SettingsPageContent />
    </PinAuthGuard>
  );
}

