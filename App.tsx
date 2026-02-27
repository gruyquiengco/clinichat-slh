import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

type AppView = 'home' | 'contacts' | 'reports' | 'profile' | 'menu';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [messages, setMessages] = useState<any[]>([]); 
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. AUTH CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. DATA FETCHING (Messages & Patients)
  useEffect(() => {
    if (!user) return;

    // Listen to messages
    const qMsg = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to patients
    const qPat = query(collection(db, "patients"));
    const unsubPat = onSnapshot(qPat, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubMsg(); unsubPat(); };
  }, [user]);

  // LOGIN FUNCTION
  const handleLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      alert("Login failed: " + err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold">CliniChat...</div>;

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <h1 className="text-5xl font-black text-purple-600 mb-2 tracking-tighter italic">CliniChat</h1>
        <p className="text-gray-500 mb-12 font-medium">Secure Healthcare Communication</p>
        <button 
          onClick={handleLogin}
          className="w-full max-w-xs bg-purple-600 text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all"
        >
          Log In to Portal
        </button>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="bg-gray-200 min-h-screen space-y-2 pt-2">
            {messages.map(msg => (
              <div key={msg.id} className="bg-white p-4 shadow-sm border-b border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm">
                    {msg.userId?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{msg.userId || "Staff Member"}</p>
                    <p className="text-[11px] text-gray-500 font-medium">2m • 🌍</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-3">
                  {msg.details || msg.text || "Updated clinical observation for patient."}
                </p>
                <div className="flex border-t border-gray-100 pt-3">
                  <button className="flex-1 text-xs font-bold text-gray-500 text-center">Like</button>
                  <button className="flex-1 text-xs font-bold text-gray-500 text-center">Comment</button>
                  <button className="flex-1 text-xs font-bold text-gray-500 text-center">Share</button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'contacts':
        return (
          <div className="bg-white min-h-screen">
            <h2 className="p-4 text-xl font-bold border-b">Patients ({patients.length})</h2>
            {patients.map(p => (
              <div key={p.id} className="flex items-center p-4 border-b hover:bg-gray-50">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold text-gray-900">{p.name || "Test Patient"}</p>
                  <p className="text-xs text-gray-500">ID: {p.id.substring(0,8)}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'menu':
        return (
          <div className="p-4 bg-gray-100 min-h-screen">
             <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full border border-purple-200"></div>
                <div>
                  <p className="font-bold text-lg">Staff User</p>
                  <button onClick={() => auth.signOut()} className="text-red-500 text-sm font-bold">Log Out</button>
                </div>
             </div>
          </div>
        );
      default:
        return <div className="p-10 text-center">View coming soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="sticky top-0 bg-white z-50">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter">CliniChat</h1>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">🔍</div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">💬</div>
          </div>
        </div>

        {/* FACEBOOK STYLE TAB BAR */}
        <nav className="flex justify-around items-center border-t border-gray-100">
          {[
            { id: 'home', icon: '🏠' },
            { id: 'contacts', icon: '👥' },
            { id: 'reports', icon: '📋' },
            { id: 'profile', icon: '👤' },
            { id: 'menu', icon: '☰' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setCurrentView(tab.id as AppView)}
              className={`flex-1 py-3 text-2xl transition-all ${
                currentView === tab.id ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-300'
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-md mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
