import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  users: UserProfile[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      alert("Invalid email or password. Remember: Default password is Surname + PRC Number.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl border-t-8 border-purple-600">
        <h2 className="text-4xl font-black italic text-purple-600 mb-2 tracking-tighter text-center">CliniChat</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-10 underline decoration-purple-600 decoration-2">Clinical Terminal</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Hospital Email</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-purple-600 rounded-2xl outline-none font-bold text-sm transition-all"
              placeholder="user@slh.com"
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Security Password</label>
            <input 
              type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-100 border-2 border-transparent focus:border-purple-600 rounded-2xl outline-none font-bold text-sm transition-all"
            />
            <button 
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10 text-[10px] font-black text-purple-600 uppercase"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-500/30 hover:bg-purple-700 transition-all">
            Authorize & Login
          </button>
          
          <p className="text-center text-[9px] text-gray-400 font-bold uppercase mt-4">
            Authorized Personnel Only • Data Privacy Act 2012
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
