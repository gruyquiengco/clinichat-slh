import React, { useState } from 'react';

// Define the views available in the app
type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // This function decides what to show on the screen based on the currentView
  const renderView = () => {
    switch (currentView) {
      case 'chat_list':
        return <div className="text-gray-800 dark:text-gray-200">Chat Threads Content</div>;
      case 'contacts':
        return <div className="text-gray-800 dark:text-gray-200">Contacts Content</div>;
      case 'reports':
        return <div className="text-gray-800 dark:text-gray-200">Reports Content</div>;
      case 'profile':
        return <div className="text-gray-800 dark:text-gray-200">Profile Content</div>;
      default:
        return <div className="text-gray-800 dark:text-gray-200">Select a view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* MOBILE HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-purple-700 rounded-md flex flex-col gap-1 focus:outline-none active:bg-purple-800"
        >
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl tracking-tight">CliniChat</span>
      </header>

      {/* MOBILE DROPDOWN NAVIGATION */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          {/* Dark overlay to close menu when tapping outside */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          
          <nav className="absolute top-16 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-800 py-4 animate-in slide-in-from-left duration-200">
            {[
              { id: 'chat_list', label: 'Threads' },
              { id: 'contacts', label: 'Contacts' },
              { id: 'reports', label: 'Reports' },
              { id: 'profile', label: 'Profile' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as AppView);
                  setIsMenuOpen(false);
                }} 
                className={`w-full text-left px-6 py-4 transition-colors ${
                  currentView === item.id 
                  ? 'bg-purple-50 text-purple-600 font-bold dark:bg-purple-900/20 dark:text-purple-400' 
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="pt-20 p-4 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
