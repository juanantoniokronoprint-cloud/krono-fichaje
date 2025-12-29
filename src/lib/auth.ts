export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  workerId?: string; // For workers, link to their worker record
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Mock users for demonstration - in real app, this would come from a database
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin'
  },
  {
    id: '2', 
    name: 'Manager User',
    email: 'manager@company.com',
    role: 'manager'
  },
  {
    id: '3',
    name: 'Juan Pérez',
    email: 'juan@company.com',
    role: 'worker',
    workerId: 'worker-1' // This would be linked to actual worker record
  },
  {
    id: '4',
    name: 'María García',
    email: 'maria@company.com', 
    role: 'worker',
    workerId: 'worker-2'
  }
];

export class AuthService {
  private static currentUser: User | null = null;
  private static listeners: ((user: User | null) => void)[] = [];

  static getCurrentUser(): User | null {
    if (!this.currentUser) {
      // Try to get user from localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
    return this.currentUser;
  }

  static login(email: string, password: string): Promise<User | null> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Mock authentication - in real app, this would validate against a server
        const user = mockUsers.find(u => u.email === email);
        
        if (user && password === 'password') { // Simple password for demo
          this.currentUser = user;
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.notifyListeners(user);
          resolve(user);
        } else {
          resolve(null);
        }
      }, 500);
    });
  }

  static logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.notifyListeners(null);
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  static isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'manager' || user?.role === 'admin';
  }

  static isWorker(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'worker';
  }

  static canAccessReports(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'manager';
  }

  static canAccessAnalytics(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'manager';
  }

  static canManageWorkers(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  static subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => listener(user));
  }
}

// Demo login credentials:
// Admin: admin@company.com / password
// Manager: manager@company.com / password  
// Worker: juan@company.com / password
// Worker: maria@company.com / password