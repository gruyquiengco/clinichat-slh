import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile, stayLoggedIn: boolean) => void;
  onSignUp: (newUser: UserProfile) => Promise<void>;
  users: UserProfile[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, users }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  
  // Registration States
  const [regFirstName, setRegFirstName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.HCW_MD);
  const [regEmpId, setRegEmpId] = useState('');
  const [regDept, setRegDept] = useState('Surgery'); // Default value

  const departments = [
    "Surgery",
    "Internal Medicine",
    "Adult IDS",
    "Pediatrics",
    "OB-Gyne",
    "Anesthesia",
    "Nursing"
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      onLogin(user, stayLoggedIn);
    } else {
      alert("Invalid email or password. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `USR-${Date.now()}`,
      email: regEmail,
      password: regPass,
      firstName: regFirstName,
      surname: regSurname,
      role: regRole,
      employeeId: regEmpId,
      photo: '', 
      specialization: regDept // Department saved here
    };
    await onSignUp(newUser);
    setIsLogin(true);
    alert("Registration successful! You can now log in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-viber-purple p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all">
        <div className="p-8 pb-6 text-center">
          <h1 className="text-3xl font-black text-viber-purple italic tracking-tighter mb-1">CliniChat SLH</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {isLogin ? 'Welcome Back' : 'Create Staff Account'}
          </p>
        </div>

        <div className="flex px-8 border-b border-gray-100">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 text-sm font-black transition-all ${isLogin ? 'text-viber-purple border-b-4 border-viber-purple' : 'text-gray-300'}`}>LOGIN</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 text-sm font-black transition-all ${!isLogin ? 'text-viber-purple border-b-4 border-viber-purple' : 'text-gray-300'}`}>REGISTER</button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="p-8 space-y-4">
          {isLogin ? (
            <>
              <div className="space-y-4">
                <input type="email" placeholder="Email Address" required className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-400 outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" id="stay" className="rounded text-purple-600" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} />
                <label htmlFor="stay" className="text-xs text-gray-500 font-bold">Stay logged in</label>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name" required className="p-3 bg-gray-50 rounded-xl border-none text-sm" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                <input placeholder="Surname" required className="p-3 bg-gray-50 rounded-xl border-none text-sm" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} />
              </div>
              <input type="email" placeholder="Work Email" required className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <input type="password" placeholder="Set Password" required className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
              
              <div className="grid grid-cols-1 gap-3">
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-gray-700"
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Employee ID" required className="p-3 bg-gray-50 rounded-xl border-none text-sm" value={regEmpId} onChange={(e) => setRegEmpId(e.target.value)} />
                <select 
                  className="p-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-viber-purple"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.HCW_MD}>Doctor (MD)</option>
                  <option value={UserRole.HCW_RN}>Nurse (RN)</option>
                  <option value={UserRole.SYSCLERK}>SysClerk</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-viber-purple text-white py-4 rounded-2xl font-black shadow-lg shadow-purple-500/30 hover:opacity-90 active:scale-[0.98] transition-all mt-4">
            {isLogin ? 'SIGN IN' : 'COMPLETE REGISTRATION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
