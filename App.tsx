import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

type AppView = 'home' | 'contacts' | 'reports' | 'profile' | 'menu';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [messages, setMessages] = useState<any[]>([]); 
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
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold">CliniChat...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <h1 className="text-4xl font-black text-purple-600 mb-8">CliniChat</h1>
        <button 
          onClick={() => signInAnonymously(auth)}
          className="w-full max-w-xs bg-purple-600 text-white py-3 rounded-lg font-bold shadow-lg"
        >
          Log In
        </button>
      </div>
    );
  }

  // 3. FACEBOOK-STYLE VIEW RENDERER
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="divide-y divide-gray-200">
            {messages.map(msg => (
              <div key={msg.id} className="bg-white p-4 mb-2 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-bold text-gray-900">{msg.userId || "Healthcare Worker"}</p>
                    <p className="text-xs text-gray-500">Just now • 🌍</p>
                  </div>
                </div>
                <p className="text-gray-800 text-sm">{msg.details || msg.text || "Updated clinical status."}</p>
              </div>
            ))}
          </div>
        );
      case 'contacts':
        return <div className="p-10 text-center text-gray-500">Patient Directory</div>;
      case 'menu':
        return (
          <div className="p-4 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Menu</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white p-4 rounded-xl shadow-sm font-bold text-left">🏥 Reports</button>
              <button className="bg-white p-4 rounded-xl shadow-sm font-bold text-left">⚙️ Settings</button>
              <button onClick={() => auth.signOut()} className="bg-white p-4 rounded-xl shadow-sm font-bold text-left text-red-500">Log Out</button>
            </div>
          </div>
        );
      default:
        return <div className="p-10 text-center">Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* TOP HEADER */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="flex justify-between items-center px-4 py-2">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter">CliniChat</h1>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-100 rounded-full">🔍</button>
            <button className="p-2 bg-gray-100 rounded-full">💬</button>
          </div>
        </div>

        {/* NAVIGATION TABS (Facebook Style) */}
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
                currentView === tab.id 
                ? 'text-purple-600 border-b-4 border-purple-600' 
                : 'text-gray-400'
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN FEED */}
      <main className="max-w-md mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
