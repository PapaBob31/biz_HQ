import React, { useState, useContext } from 'react';
import { Lock, User, ShieldCheck, EyeOff, Eye } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"


interface LoginScreenProps {
  onLoginSuccess: (param: {token: string, businessDetails: any})=>void, 
  navigateTo: (screen: 'Admin Verification Prompt'|'Password Reset')=>void
}

export default function LoginScreen({ onLoginSuccess, navigateTo } : LoginScreenProps) {
  const [creds, setCreds] = useState({ username: '', password: '', role: 'Admin' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const api = useContext(AxiosHttpRequest)!
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    api.post("/api/employees/login", creds)
    .then(response => {
      onLoginSuccess(response.data);
    }).catch(error => {
      console.log(error.message)
      if (error.response?.data) {
        setError(error.response.data.message)
        console.log(error.response.data)
      }
    })
    .finally(()=> {
      setIsLoading(false)
    })
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-md">
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
                className="w-full pl-10 pr-4 py-2 outline-black outline-1 focus:outline-2 rounded-lg focus:outline-blue-600"
                onChange={(e) => setCreds({...creds, username: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} required
                className="w-full pl-10 pr-4 py-2 outline-black outline-1 focus:outline-2 rounded-lg focus:outline-blue-600"
                onChange={(e) => setCreds({...creds, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
        
        <div className="flex justify-between mt-2 text-md">
          <button className="text-blue-400 cursor-pointer hover:underline" onClick={()=>navigateTo('Password Reset')}>Forgot Password?</button>
          <button className="text-slate-400 cursor-pointer hover:underline" onClick={()=>navigateTo('Admin Verification Prompt')}>Verify Admin Acct</button>
        </div>
      </div>
    </div>
  )
}
