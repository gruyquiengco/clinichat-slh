import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

type AppView = 'chats' | 'patients' | 'reports' | 'menu';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'clerk' | 'hcw'>('hcw');
  const [currentView, setCurrentView] = useState<AppView>('chats');
  const [messages, setMessages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        if (currentUser.email.includes('admin')) setRole('admin');
        else if (currentUser.email.includes('mreyes')) setRole('clerk');
        else if (currentUser.email.includes('jcruz')) setRole('hcw');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-purple-600 font-bold">Connecting...</div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-4xl font-black text-purple-600 mb-8 italic">CliniChat</h1>
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-white p-8 rounded-2xl shadow-xl">
          <input type="email" placeholder="Email" className="w-full p-4 border rounded-xl" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 border rounded-xl" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold">Login</button>
        </form>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'chats':
        return (
          <div className="flex flex-col p-4 space-y-4 bg-slate-50 min-h-[calc(100vh-120px)]">
            {messages.map((msg, i) => {
              const isMe = msg.userId === user.email.split('@')[0];
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    {!isMe && <p className="text-[10px] font-bold text-purple-500 mb-1 uppercase">{msg.userId}</p>}
                    <p className="text-sm">{msg.text || msg.details}</p>
                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'patients':
        return (
          <div className="bg-white min-h-screen p-4">
            <h2 className="font-bold text-lg mb-4">Patient Directory</h2>
            {role === 'clerk' ? <p className="text-gray-400 italic">Access restricted for Clerks.</p> : 
              patients.map(p => <div key={p.id} className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">{p.name?.[0]}</div>
                <p className="font-medium text-gray-700">{p.name}</p>
              </div>)
            }
          </div>
        );
      case 'menu':
        return (
          <div className="p-6">
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mb-4 text-center">
              <p className="font-bold text-purple-700 text-lg">{user.email}</p>
              <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mt-1">Role: {role}</p>
            </div>
            <button onClick={() => signOut(auth)} className="w-full bg-red-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-red-100">Sign Out</button>
          </div>
        );
      default: return <div className="p-10 text-center text-gray-400">Section available for {role} soon.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white z-50 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter italic">CliniChat</h1>
          <div className="flex gap-4 text-xl text-gray-400"><span>🔍</span><span>📷</span></div>
        </div>
        
        {/* FACEBOOK STYLE TOP NAV */}
        <nav className="flex justify-around items-end h-12">
          {[
            { id: 'chats', icon: '💬' },
            { id: 'patients', icon: '👥' },
            { id: 'reports', icon: '📋' },
            { id: 'menu', icon: '☰' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setCurrentView(tab.id as AppView)}
              className={`flex-1 flex flex-col items-center pb-2 text-2xl transition-all ${
                currentView === tab.id ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-300'
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-md mx-auto mb-20">
        {renderView()}
      </main>

      {/* CHAT INPUT FIELD (Only on chat view) */}
      {currentView === 'chats' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">➕</div>
          <input type="text" placeholder="Type a message..." className="flex-1 bg-gray-100 p-3 rounded-full text-sm outline-none" />
          <button className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">➔</button>
        </div>
      )}
    </div>
  );
}
