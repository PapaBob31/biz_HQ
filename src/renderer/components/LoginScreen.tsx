// src/renderer/components/LoginScreen.tsx
import React, { useState, createContext } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

/* session strategy
  1. User logs in
  2. Acccess token is generated that never expires unless the client has been inactive for a while (2 hours)
  3. Check

  Things that invalidate access tokens
  1. Logging out
  2. Inactivity
*/


const LoginScreen: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [creds, setCreds] = useState({ username: '', password: '', role: 'Admin' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Connects to ipcMain.handle('user-login') via preload.ts
      const result = await (window as any).electronAPI.loginUser(creds);
      if (result.success) {
        onLoginSuccess(result.message);
      } else {
        setError('Invalid username, password or role');
      }
    } catch (err) {
      console.log(err)
      setError('Error occured while trying to log employee in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <ShieldCheck size={40} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">Biz HQ Employee Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setCreds({...creds, username: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setCreds({...creds, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Role</label>
            <select 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white cursor-pointer"
              onChange={(e) => setCreds({...creds, role: e.target.value})}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Other">Other</option>
            </select>
          </div>
          

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            {isLoading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;