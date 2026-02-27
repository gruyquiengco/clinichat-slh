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

  // 2. DATA FETCHING
  useEffect(() => {
    if (!user) return;
    // Listening to your 'messages' collection
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Firestore Error:", err));
    
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold">CliniChat...</div>;

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="w-20 h-20 bg-purple-600 rounded-2xl mb-6 flex items-center justify-center text-white text-4xl font-black shadow-xl">C</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">CliniChat</h1>
        <p className="text-gray-500 mb-8">Secure Clinical Portal</p>
        <button 
          onClick={() => signInAnonymously(auth)}
          className="w-full max-w-xs bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          Enter Portal
        </button>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-2">
            {messages.length === 0 && <p className="p-10 text-center text-gray-400">No activity logged yet.</p>}
            {messages.map(msg => (
              <div key={msg.id} className="bg-white p-4 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mr-3">
                    {msg.userId?.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{msg.userId || "Healthcare Worker"}</p>
                    <p className="text-[10px] text-gray-400">
                      {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : "Just now"} • 🔒
                    </p>
                  </div>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">{msg.details || msg.text || msg.action || "Status updated."}</p>
              </div>
            ))}
          </div>
        );
      case 'contacts':
        return <div className="p-10 text-center text-gray-500 font-medium">Patient & Staff Directory</div>;
      case 'menu':
        return (
          <div className="p-4 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-bold text-lg">Practitioner Mode</p>
                  <p className="text-xs text-gray-500">ID: {user.uid.substring(0,8)}...</p>
                </div>
              </div>
              <button onClick={() => auth.signOut()} className="w-full text-left p-4 text-red-500 font-bold hover:bg-gray-50">
                Log Out
              </button>
            </div>
          </div>
        );
      default:
        return <div className="p-10 text-center text-gray-400">View coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter">CliniChat</h1>
          <div className="flex gap-3">
            <button className="text-xl">🔍</button>
            <button className="text-xl">💬</button>
          </div>
        </div>

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
              className={`flex-1 py-3 text-2xl ${
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
