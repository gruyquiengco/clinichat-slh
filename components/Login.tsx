import React, { useState } from 'react';
import { UserProfile } from '../types';

const Login: React.FC<any> = ({ onLogin, onSignUp, users }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u: any) => u.email === email && u.password === pass);
    if (user) {
      onLogin(user);
    } else {
      alert("Invalid credentials. Please check your email/password.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F3F3F7]">
      <div className="w-full bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100">
        <h1 className="text-4xl font-black text-purple-600 italic text-center mb-2">CliniChat</h1>
        <p className="text-[10px] text-gray-400 font-bold text-center mb-10 tracking-widest uppercase">Secured Clinical Database</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Hospital Email</label>
            <input 
              className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 font-bold focus:border-purple-500 outline-none transition-all"
              type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@slh.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Password</label>
            <input 
              className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 font-bold focus:border-purple-500 outline-none transition-all"
              type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase shadow-lg shadow-purple-200 active:scale-95 transition-all">
            Enter Database
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
