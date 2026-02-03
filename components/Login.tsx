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
  const [middleName, setMiddleName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.HCW);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (view === 'signup') {
      if (!email || !password || !firstName || !surname) {
        setError('All fields are mandatory for registration.');
        return;
      }
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('This email is already in the registry.');
        return;
      }
      const newUser: UserProfile = {
        id: Math.random().toString(36).substr(2, 9),
        firstName,
        surname,
        middleName,
        email,
        password,
        role,
        specialization: role === UserRole.HCW ? 'Medical Staff' : 'Records Clerk',
        department: 'Internal Medicine', // Default for self-signup
        phone: '09XX-XXX-XXXX',
        photo: '' // Empty by default for initials avatar
      };
      onSignUp(newUser);
      setSuccess('Registration request submitted. You may now log in.');
      setView('login');
      setPassword('');
      setFirstName('');
      setSurname('');
      setMiddleName('');
    } else if (view === 'login') {
      if (!email || !password) {
        setError('Enter credentials.');
        return;
      }
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (user) {
        onLogin(user, stayLoggedIn);
      } else {
        setError('Invalid credentials. Check email/password.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-viber-bg dark:bg-viber-dark px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-10 text-center bg-viber-purple text-white relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl border border-white/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter">CliniChat SLH</h2>
          <p className="mt-1 text-purple-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Secured Clinical Database</p>
        </div>
        
        <form onSubmit={handleAuth} className="p-8 space-y-5">
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold rounded-xl text-center">{error}</div>}
          {success && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-xl text-center">{success}</div>}

          {view === 'signup' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="First Name" />
                <input value={surname} onChange={e => setSurname(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="Surname" />
              </div>
              <input value={middleName} onChange={e => setMiddleName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="Middle Initial (Optional)" maxLength={1} />
            </div>
          )}

          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="Hospital Email" />
          
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 pr-10 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="Password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" className="w-full bg-viber-purple text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:opacity-90 active:scale-[0.98] transition-all">
            {view === 'signup' ? 'REGISTER' : 'SECURE LOGIN'}
          </button>

          <div className="text-center">
            <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-purple-600">
              {view === 'login' ? 'Create new account' : 'Back to login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;






