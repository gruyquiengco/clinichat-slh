import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

type AppView = 'chats' | 'patients' | 'reports' | 'menu';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'clerk' | 'hcw' | 'guest'>('guest');
  const [currentView, setCurrentView] = useState<AppView>('chats');
  const [messages, setMessages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. STABLE AUTH CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Safely determine role
        const emailLower = currentUser.email?.toLowerCase() || '';
        if (emailLower.includes('admin')) setRole('admin');
        else if (emailLower.includes('mreyes')) setRole('clerk');
        else if (emailLower.includes('jcruz')) setRole('hcw');
        else setRole('guest');
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Auth Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. STABLE DATA FETCHING
  useEffect(() => {
    if (!user) return;

    // Use a try-catch pattern within the snapshot to prevent crashes
    const qMsg = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    }, (err) => console.error("Message Fetch Error:", err));

    const qPat = query(collection(db, "patients"));
    const unsubPat = onSnapshot(qPat, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
    }, (err) => console.error("Patient Fetch Error:", err));

    return () => { unsubMsg(); unsubPat(); };
  }, [user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(err => alert("Login Error: " + err.message));
  };

  // Prevent blank screen by showing a centered spinner
  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-purple-600 font-bold animate-pulse">Initializing Secure Connection...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <h1 className="text-4xl font-black text-purple-600 mb-2 italic tracking-tighter">CliniChat</h1>
          <p className="text-gray-400 text-sm mb-8 font-medium italic">SLH Internal Communication</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-purple-600" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-purple-600" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100 active:scale-95 transition-all">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 bg-white z-50 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter italic">CliniChat</h1>
          <div className="flex gap-4 text-xl text-gray-400 italic font-bold">
            <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-1 rounded-lg uppercase tracking-widest">{role}</span>
          </div>
        </div>
        
        <nav className="flex justify-around items-end h-12">
          {[{ id: 'chats', icon: '💬' }, { id: 'patients', icon: '👥' }, { id: 'reports', icon: '📋' }, { id: 'menu', icon: '☰' }].map((tab) => (
            <button key={tab.id} onClick={() => setCurrentView(tab.id as AppView)}
              className={`flex-1 flex flex-col items-center pb-2 text-2xl transition-all ${currentView === tab.id ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-300'}`}
            >{tab.icon}</button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        {currentView === 'chats' && (
          <div className="p-4 space-y-4">
            {messages.length === 0 && <p className="text-center text-gray-400 mt-20 italic">No messages in clinical thread...</p>}
            {messages.map((msg) => {
              const isMe = msg.userId === user.email?.split('@')[0];
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    {!isMe && <p className="text-[10px] font-bold text-purple-500 mb-1 uppercase tracking-tighter">{msg.userId || 'User'}</p>}
                    <p className="text-sm leading-snug">{msg.text || msg.details || "Update logged."}</p>
                    <p className={`text-[8px] mt-1 text-right font-medium opacity-70`}>
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentView === 'patients' && (
          <div className="bg-white min-h-screen p-4">
            <h2 className="font-bold text-lg mb-4 border-b pb-2">Patient Records</h2>
            {role === 'clerk' ? <p className="text-gray-400 text-center p-10 italic">Access Restricted to HCW/Admin</p> : 
              patients.map(p => <div key={p.id} className="p-4 border-b flex items-center gap-3 active:bg-gray-50 uppercase text-xs font-bold tracking-tight">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">👤</div>
                {p.name || "UN
