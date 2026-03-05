import React, { useState } from 'react';
import { UserProfile } from '../types';

const Login: React.FC<any> = ({ onLogin, onSignUp, users }) => {
  const [isReg, setIsReg] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen bg-[#F3F3F7] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl">
        <h1 className="text-4xl font-black text-purple-600 italic text-center mb-8">CliniChat</h1>
        
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const u = users.find((x:any) => x.email === email && x.password === pass);
          u ? onLogin(u, true) : alert("Check credentials");
        }}>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Hospital Email</label>
            <input 
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:border-purple-500 outline-none"
              type="email" value={email} onChange={e => setEmail(e.target.value)} required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Password</label>
            <input 
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:border-purple-500 outline-none"
              type="password" value={pass} onChange={e => setPass(e.target.value)} required 
            />
          </div>
          <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-purple-200 mt-4">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
