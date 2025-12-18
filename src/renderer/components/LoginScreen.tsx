import React, { useState } from 'react';
import type { UserSession, UserRole } from '../../types';

interface LoginProps {
  onLoginSuccess: (user: UserSession) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Cashier');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd validate against a local DB or Clover API here
    onLoginSuccess({
      username,
      role,
      isAuthenticated: true
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Staff Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" placeholder="Username" required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" placeholder="PIN / Password" required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
            <option value="Other">Other Staff</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
            Enter System
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;