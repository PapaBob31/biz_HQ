// src/renderer/components/LoginScreen.tsx
import React, { useState, useContext } from 'react';
import { Lock, User, ShieldCheck, Mail, KeyRound, ArrowRight, Loader2, EyeOff, Eye } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"


export default function AuthScreeen({ onAuthSuccess }: {onAuthSuccess: (param: {token: string, businessDetails: any})=>void}){
  const [creds, setCreds] = useState({ username: '', password: '', role: 'Admin' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const api = useContext(AxiosHttpRequest)!
  const [activeScreen, setActiveScreen] = useState<"login"|"verification-request"|"paswd-reset-request">("login")
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    api.post("/api/employees/login", creds)
    .then(response => {
        onAuthSuccess(response.data);
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
      {activeScreen === "login" && (<>
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
                type={showPassword ? "text" : "password"} required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
      </>)}
      {activeScreen === "paswd-reset-request" && <AuthActionScreen type={'reset'} onSend={()=>{}} isLoading={true} />}
      </div>
    </div>
  );
};


interface AuthActionProps {
  type: 'verify' | 'reset';
  email: string;
  onSend: () => void;
  isLoading?: boolean;
}

export function AuthActionScreen({ type, email, onSend, isLoading } : AuthActionProps) {
  const isVerify = type === 'verify';

  return (
    <>
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        {/* Icon Header */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isVerify ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {isVerify ? <Mail size={40} /> : <KeyRound size={40} />}
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {isVerify ? 'Verify your identity' : 'Reset your password'}
        </h1>
        <p className="text-slate-500 mb-8 px-4">
          {isVerify 
            ? `We need to verify your account. We will send a 6-digit code to ` 
            : `To reset your password, we need to send a secure code to `}
          <span className="font-semibold text-slate-700">{email}</span>
        </p>

        {/* Action Button */}
        <button
          onClick={onSend}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
            isVerify ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {isVerify ? 'Send Verification Code' : 'Request Reset Link'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
        
        <button className="mt-6 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
          Not your email? Log out
        </button>
      </div>
    </>
  );
};