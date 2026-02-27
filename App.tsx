import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const [newMessage, setNewMessage] = useState('');

  // 1. AUTH LOGIC
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const emailLower = currentUser.email?.toLowerCase() || '';
        if (emailLower.includes('admin')) setRole('admin');
        else if (emailLower.includes('mreyes')) setRole('clerk');
        else if (emailLower.includes('jcruz')) setRole('hcw');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. DATA LISTENERS
  useEffect(() => {
    if (!user) return;
    const qMsg = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qPat = query(collection(db, "patients"));
    const unsubPat = onSnapshot(qPat, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubMsg(); unsubPat(); };
  }, [user]);

  // 3. ACTIONS
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        userId: user.email?.split('@')[0],
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <h1 className="text-4xl font-black text-purple-600 mb-2 italic">CliniChat</h1>
          <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest font-bold">SLH Authorized Personnel Only</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 border rounded-2xl" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border rounded-2xl" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 bg-white z-50 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <h1 className="text-2xl font-black text-purple-600 italic">CliniChat</h1>
          <div className="flex gap-4 text-gray-400"><span>🔍</span><span>📷</span></div>
        </div>
        <nav className="flex justify-around items-end h-12">
          {[{ id: 'chats', icon: '💬' }, { id: 'patients', icon: '👥' }, { id: 'reports', icon: '📋' }, { id: 'menu', icon: '☰' }].map((tab) => (
            <button key={tab.id} onClick={() => setCurrentView(tab.id as AppView)}
              className={`flex-1 flex flex-col items-center pb-2 text-2xl ${currentView === tab.id ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-300'}`}
            >{tab.icon}</button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full pb-24 overflow-y-auto">
        {currentView === 'chats' && (
          <div className="p-4 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.userId === user.email?.split('@')[0];
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    {!isMe && <p className="text-[10px] font-black text-purple-500 mb-1 uppercase tracking-tight">{msg.userId}</p>}
                    <p className="text-sm leading-tight">{msg.text || msg.details}</p>
                    <p className="text-[8px] mt-1 text-right opacity-60">
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
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
            {role === 'clerk' ? <p className="text-gray-400 text-center py-10 italic">Access Restricted</p> : 
              patients.map(p => (
                <div key={p.id} className="p-4 border-b flex items-center gap-3 font-bold text-xs text-gray-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">👤</div>
                  {p.name || "TEST PATIENT"}
                </div>
              ))
            }
          </div>
        )}

        {currentView === 'menu' && (
          <div className="p-6 space-y-4">
            <div className="bg-white p-6 rounded-3xl text-center border border-gray-100">
              <p className="font-bold text-gray-900">{user.email}</p>
              <p className="text-xs text-purple-600 font-bold uppercase mt-1 tracking-widest">{role} Portal</p>
            </div>
            <button onClick={() => signOut(auth)} className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-bold">Log Out</button>
          </div>
        )}
      </main>

      {currentView === 'chats' && (
        <form onSubmit={sendMessage} className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Type clinical update..." 
            className="flex-1 bg-gray-100 p-3 rounded-2xl text-sm outline-none" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="bg-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">➔</button>
        </form>
      )}
    </div>
  );
}
