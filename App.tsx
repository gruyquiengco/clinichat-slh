import React, { useState, useEffect } from 'react';
import { db } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Define the views available in the app
type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  // 1. STATE & UI LOGIC
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [threads, setThreads] = useState<any[]>([]); // This holds your patient threads
  const [loading, setLoading] = useState(true);

  // 2. FIREBASE LOGIC (Restoring communication with your database)
  useEffect(() => {
    // We are looking for a collection named "threads". 
    // If your Firebase uses "chats" or "messages", change the word below.
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(threadData);
      setLoading(false);
    }, (error) => {
      console.error("Firebase connection error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. VIEW RENDERER
  const renderView = () => {
    if (loading) return <div className="p-8 text-center text-gray-500">Loading your clinic data...</div>;

    switch (currentView) {
      case 'chat_list':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Patient Chat Threads</h2>
            {threads.length === 0 ? (
              <div className="p-10 border-2 border-dashed rounded-xl text-center text-gray-400">
                No active patient threads found in the database.
              </div>
            ) : (
              threads.map(thread => (
                <div key={thread.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{thread.patientName || "General Inquiry"}</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      {thread.status || "Active"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 truncate">{thread.lastMessage || "No messages yet..."}</p>
                </div>
              ))
            )}
          </div>
        );
      case 'contacts':
        return <div className="p-4 text-gray-700 font-medium">Medical Staff Directory</div>;
      case 'reports':
        return <div className="p-4 text-gray-700 font-medium">Clinical Reports & Logs</div>;
      case 'profile':
        return <div className="p-4 text-gray-700 font-medium">Your Practitioner Profile</div>;
      default:
        return <div className="p-4">Select a menu option.</div>;
    }
  };

  // 4. MAIN UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* MOBILE TOP BAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-purple-700 rounded-lg flex flex-col gap-1 focus:ring-2 focus:ring-white"
        >
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl tracking-tight">CliniChat</span>
      </header>

      {/* MOBILE NAV MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-16 left-0 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800 py-6 transform transition-transform duration-300">
            {['chat_list', 'contacts', 'reports', 'profile'].map((view) => (
              <button 
                key={view}
                onClick={() => {setCurrentView(view as AppView); setIsMenuOpen(false);}} 
                className={`w-full text-left px-8 py-4 capitalize text-lg ${
                  currentView === view 
                  ? 'bg-purple-50 text-purple-600 font-bold border-r-4 border-purple-600' 
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {view.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* CONTENT AREA */}
      <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
