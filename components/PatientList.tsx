import React, { useState } from 'react';
import { Patient, UserProfile, UserRole, Message } from '../types';
import { WARD_OPTIONS, WARD_COLORS } from '../constants';
import { db } from '../firebase-config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  currentUser: UserProfile;
  setPatients: (updater: any) => void;
  addAuditLog: (action: any, details: string, targetId: string) => void;
}

const CHAT_BGS = [
  '#f5f6f7', // Default
  '#eef2ff', // Soft Blue
  '#fdf2f8', // Soft Pink
  '#f0fdf4', // Soft Green
  '#fffbeb', // Soft Amber
  '#faf5ff', // Soft Purple
];

type SortOption = 'alphabetical' | 'dateAdmitted' | 'ward' | 'age' | 'roomNumber';

const PatientList: React.FC<PatientListProps> = ({ patients, messages, onSelect, currentUser, setPatients, addAuditLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdmitted');
  
  const [selectedBg, setSelectedBg] = useState(CHAT_BGS[0]);

  const capitalizeName = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getInitials = (firstName: string, surname: string) => {
    return `${firstName[0] || ''}${surname[0] || ''}`.toUpperCase();
  };

  const filteredPatients = patients.filter(p => {
    return p.isArchived === (activeTab === 'discharged') &&
      (p.surname.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.patientId.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.surname.localeCompare(b.surname);
      case 'dateAdmitted':
        return new Date(b.dateAdmitted).getTime() - new Date(a.dateAdmitted).getTime();
      case 'ward':
        return a.ward.localeCompare(b.ward);
      case 'age':
        return a.age - b.age;
      case 'roomNumber':
        return a.roomNumber.localeCompare(b.roomNumber);
      default:
        return 0;
    }
  });

  const addNewPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newId = Math.random().toString(36).substr(2, 9);
    const ward = formData.get('ward') as string;
    
    const patientData: Omit<Patient, 'id'> = {
      surname: capitalizeName(formData.get('surname') as string),
      firstName: capitalizeName(formData.get('firstName') as string),
      age: parseInt(formData.get('age') as string) || 0,
      sex: formData.get('sex') as any,
      diagnosis: capitalizeName(formData.get('diagnosis') as string),
      patientId: formData.get('patientId') as string,
      ward: ward, 
      roomNumber: formData.get('roomNumber') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      mainHCWId: currentUser.id,
      members: [currentUser.id],
      avatarColor: WARD_COLORS[ward] || '#7360f2',
      chatBg: selectedBg
    };
    
    // Close modal immediately to provide instant visual feedback to the user
    setShowAddModal(false);
    setSelectedBg(CHAT_BGS[0]);
    
    try {
      // Save to Firestore
      await setDoc(doc(db, 'patients', newId), patientData);
      addAuditLog('CREATE', `Added new patient: ${patientData.surname}`, newId);
      
      // Navigate to newly created thread
      onSelect(newId);
    } catch (error) {
      console.error("Critical: Error creating patient thread:", error);
      alert("System Error: Failed to create patient thread. Check your connection.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-10 transition-colors">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Patient Threads</h2>
        {(currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSCLERK) && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="viber-purple text-white p-2.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1 shadow-lg active:scale-95"
            title="Add Patient"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          </button>
        )}
      </div>

      <div className="flex bg-white dark:bg-viber-dark px-4 pt-2 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-400 dark:text-gray-600'}`}
        >
          Active
        </button>
        <button 
          onClick={() => setActiveTab('discharged')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'discharged' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-400 dark:text-gray-600'}`}
        >
          Discharged
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 space-y-3 transition-colors">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search patient"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase whitespace-nowrap">Sort by:</span>
          <select 
            className="bg-gray-100 dark:bg-gray-800 dark:text-gray-300 text-xs font-semibold py-1 px-3 rounded-full border-none focus:ring-1 focus:ring-purple-400 outline-none transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="alphabetical">Surname (A-Z)</option>
            <option value="dateAdmitted">Date Admitted (Newest)</option>
            <option value="ward">Ward</option>
            <option value="age">Age</option>
            <option value="roomNumber">Room Number</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-4 scrollbar-hide">
        {sortedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 dark:text-gray-600">
            <svg className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p className="text-lg font-medium">No {activeTab} patient threads</p>
            <p className="text-sm">Cloud updates will appear here instantly.</p>
          </div>
        ) : (
          sortedPatients.map(patient => {
            const isMember = patient.members.includes(currentUser.id);
            const unreadCount = messages.filter(m => 
              m.patientId === patient.id && 
              m.type !== 'system' && 
              !m.readBy.includes(currentUser.id)
            ).length;
            
            return (
              <button
                key={patient.id}
                onClick={() => onSelect(patient.id)}
                className={`w-full flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800 transition-colors text-left ${patient.isArchived ? 'opacity-70 dark:opacity-60 grayscale-[0.3]' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div className="relative flex-shrink-0">
                  <div 
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-colors`}
                    style={{ 
                      backgroundColor: patient.isArchived ? '#e5e7eb' : (WARD_COLORS[patient.ward] || '#7360f2'),
                      color: '#ffffff'
                    }}
                  >
                    {getInitials(patient.firstName, patient.surname)}
                  </div>

                  {isMember && unreadCount > 0 && !patient.isArchived && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white dark:border-gray-900 shadow-sm z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}

                  {!isMember && (
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-900 shadow-sm z-10">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`truncate ${unreadCount > 0 && isMember ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-900 dark:text-gray-100'}`}>
                      {patient.surname}, {patient.firstName}
                      {patient.isArchived && <span className="ml-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black">DISCHARGED</span>}
                    </h3>
                    <span className={`text-xs ${unreadCount > 0 && isMember ? 'text-purple-600 font-bold' : 'text-gray-400 dark:text-gray-600'}`}>
                      {patient.dateAdmitted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${unreadCount > 0 && isMember ? 'text-gray-900 dark:text-gray-200 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {patient.diagnosis}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${patient.isArchived ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                      {patient.ward} • {patient.roomNumber}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all overflow-y-auto overscroll-contain">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg my-auto shadow-2xl transition-colors flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold dark:text-white">New Patient Admission</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <form id="new-patient-form" onSubmit={addNewPatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Surname</label>
                    <input name="surname" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">First Name</label>
                    <input name="firstName" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Age</label>
                    <input name="age" type="number" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Sex</label>
                    <select name="sex" className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Patient ID</label>
                    <input name="patientId" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base" placeholder="PT-001" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Diagnosis</label>
                  <textarea name="diagnosis" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl h-24 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Ward</label>
                    <select name="ward" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base">
                      {WARD_OPTIONS.map(ward => (
                        <option key={ward} value={ward}>{ward}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Room No.</label>
                    <input name="roomNumber" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thread Appearance</h4>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">Thread Background</label>
                    <div className="flex flex-wrap gap-3">
                      {CHAT_BGS.map(color => (
                        <button 
                          key={color}
                          type="button"
                          onClick={() => setSelectedBg(color)}
                          className={`w-9 h-9 rounded-full border-2 transition-all ${selectedBg === color ? 'border-purple-600 scale-110 shadow-md ring-2 ring-purple-100 dark:ring-purple-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button 
                type="submit" 
                form="new-patient-form"
                className="w-full viber-purple text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all"
              >
                Create Patient Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;






