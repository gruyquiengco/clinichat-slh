import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile, stayLoggedIn: boolean) => void;
  onSignUp: (user: UserProfile) => void;
  users: UserProfile[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, users }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  // Sign Up Fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.HCW);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const lowerEmail = email.toLowerCase().trim();

    if (view === 'signup') {
      if (!lowerEmail || !password || !firstName || !surname) {
        setError('All fields are mandatory for account registration.');
        return;
      }
      if (users.some(u => u.email.toLowerCase() === lowerEmail)) {
        setError('This email is already registered in the SLH database.');
        return;
      }
      const newUser: UserProfile = {
        id: Math.random().toString(36).substr(2, 9),
        firstName,
        surname,
        email: lowerEmail,
        password,
        role,
        specialization: role === UserRole.HCW ? 'Medical Staff' : 'Administrative Staff',
        department: 'General',
        phone: '09XX-XXX-XXXX',
        photo: `https://i.pravatar.cc/150?u=${lowerEmail}`
      };
      onSignUp(newUser);
      setSuccess('Account created successfully! You may now log in.');
      setView('login');
      setPassword('');
    } else if (view === 'login') {
      if (!lowerEmail || !password) {
        setError('Please enter both your hospital email and password.');
        return;
      }

      // We find the user from the global 'users' list provided by Firebase via App.tsx
      const user = users.find(u => u.email.toLowerCase() === lowerEmail && u.password === password);
      
      if (user) {
        onLogin(user, stayLoggedIn);
      } else {
        const emailExists = users.some(u => u.email.toLowerCase() === lowerEmail);
        if (emailExists) {
          setError('Incorrect password. Please try again.');
        } else {
          setError('Email not found in the hospital registry.');
        }
      }
    } else if (view === 'forgot') {
      if (!lowerEmail || !lowerEmail.includes('@')) {
        setError('Please enter a valid hospital email address.');
        return;
      }
      setSuccess('Recovery instructions sent to ' + lowerEmail);
      setView('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-viber-bg dark:bg-viber-dark px-4 transition-colors duration-300 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all border border-gray-100 dark:border-gray-800">
        <div className="p-10 text-center bg-viber-purple text-white relative">
          <div className="absolute top-4 right-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M13.5 1h-7a2 2 0 00-2 2v14a2 2 0 002 2h7a2 2 0 002-2V3a2 2 0 00-2-2zM9 17h2a1 1 0 110 2H9a1 1 0 110-2zm5-4H6V4h8v9z" /></svg>
          </div>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl border border-white/30 relative z-10">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter">CliniChat SLH</h2>
          <p className="mt-1 text-purple-100 text-xs font-bold uppercase tracking-widest opacity-80">
            {view === 'forgot' ? 'Account Recovery' : 'Secured Clinical Registry'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 text-center animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl text-xs font-bold text-green-600 dark:text-green-400 text-center animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {success}
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-left-2">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">First Name</label>
                <input 
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all" 
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Surname</label>
                <input 
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all" 
                  placeholder="Dela Cruz"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Hospital Email</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all" 
              placeholder="name@slh.com"
            />
          </div>

          {view !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                {view === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 uppercase tracking-tighter"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.04m4.533-4.461A10.001 10.001 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.017 10.017 0 01-1.39 3.036m-4.208-4.138a3 3 0 11-4.243-4.243M9.878 9.878l4.242 4.242M3 3l18 18"></path></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="animate-in fade-in slide-in-from-right-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Role</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
              >
                <option value={UserRole.HCW}>Medical Staff (HCW)</option>
                <option value={UserRole.SYSCLERK}>Records Clerk (SYSCLERK)</option>
              </select>
            </div>
          )}

          {view === 'login' && (
            <div className="flex items-center ml-1">
              <input 
                id="stay" 
                type="checkbox" 
                checked={stayLoggedIn}
                onChange={e => setStayLoggedIn(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="stay" className="ml-2 block text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer">
                Remember this device
              </label>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-viber-purple text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-200 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {view === 'signup' ? 'CREATE ACCOUNT' : view === 'forgot' ? 'SEND RECOVERY EMAIL' : 'SECURE LOG IN'}
          </button>

          <div className="pt-2 text-center">
            {view === 'forgot' ? (
              <button 
                type="button"
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest"
              >
                Back to Login
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); setShowPassword(false); }}
                className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest"
              >
                {view === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
              </button>
            )}
          </div>

          <div className="pt-4 text-[9px] text-gray-400 dark:text-gray-600 leading-relaxed text-center font-bold uppercase tracking-tighter">
            Authorized Personnel Only. <br/> Access is monitored under DPA 2012.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
