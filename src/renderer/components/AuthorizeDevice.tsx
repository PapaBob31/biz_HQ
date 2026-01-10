import React, { useState } from 'react';
import type { UserRole, CloverAuthResponse } from '../../types';
import { employees }  from "../../App"


function auth(employees: any, data: any){
  for(let employee of employees) {
    if (employee.username === data.username && employee.password === data.password && employee.role === data.role) {
      return { success: true, token: "mock_clover_token_12345", role: data.role, error: "", username: data.username }
    }
  }
  return { error: "Invalid Username or password or wrong role picked", success: false, username: "", role: data.role}
}

interface AuthProps {
  onAuthSuccess: (data: CloverAuthResponse) => void;
}

const AuthorizeDevice: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Admin');
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      
      const response: CloverAuthResponse = await (() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(auth(employees, {...credentials, role}))
          }, 1500);
        });
      })();

      // const response = authorizeCredentials(credentials)

      if (response.success) {
        onAuthSuccess(response);
      } else {
        setError(response.error || 'Authorization failed.');
      }
    } catch (err) {
      setError('Failed to connect to Clover Service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 w-full">
      <div className="mx-auto w-[35%] min-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-slate-800">Authorization</h1>
          <p className="text-slate-500 text-sm mt-2"><span className="text-blue-500 text-lg">Biz HQ.</span> Next Gen Business Management</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 text-black">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Employee Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Role</label>
            <select 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition bg-blue-500`}
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorizeDevice;