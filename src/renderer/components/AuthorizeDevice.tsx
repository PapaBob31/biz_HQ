import React, { useState } from 'react';
import type { UserRole, CloverAuthResponse } from '../../types';

interface AuthProps {
  onAuthSuccess: (data: CloverAuthResponse) => void;
}



function authorizeCredentials({username, password}: {username: string, password: string}) {
  const acceptedCredentials = [{"username": "Adeddamola", "password": "12345678"}] // hard-coded for now
  for (const credential of acceptedCredentials) {
    if (credential.username === username && credential.password === password) {
      return {success: true, role: "Admin", username: "Adedamola"}
    }
  }
  return {success: false}

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
      // const response: CloverAuthResponse = await (window as any).electronAPI.authorizeDevice({
      //   ...credentials,
      //   role
      // });

      const response = authorizeCredentials(credentials)

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Clover Authorization</h1>
          <p className="text-slate-500 text-sm mt-2">Link this device to your business account</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Clover Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Device Password</label>
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
            className={`w-full py-3 rounded-lg font-bold text-white transition ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
          >
            {loading ? 'Processing...' : 'Authorize Device'}
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