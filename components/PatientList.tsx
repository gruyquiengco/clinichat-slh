import React, { useState } from 'react';
import { Patient, UserProfile, Message } from '../types';
import { WARD_OPTIONS, WARD_COLORS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (id: string) => void;
  currentUser: UserProfile;
  setPatients: (patientData: any) => Promise<void>;
  addAuditLog: (action: string, details: string, targetId: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ 
  patients = [], 
  messages = [],
  onSelect, 
  onReadmit, 
  currentUser,
  setPatients,
  addAuditLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');

  const getInitials = (first: string, last: string) => 
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  const filteredPatients = patients.filter(p => 
    p.isArchived === (activeTab === 'discharged') && 
    (p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addNewPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const patientData = {
      surname: formData.get('surname') as string,
      firstName: formData.get('firstName') as string,
      age: formData.get('age') as string, // RESTORED POINT 3
      sex: formData.get('sex') as string, // RESTORED POINT 3
      ward: formData.get('ward') as string, 
      roomNumber: formData.get('roomNumber') as string,
      diagnosis: formData.get('diagnosis') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      members: [currentUser.id], // Creator is auto-added to team
      avatarColor: WARD_COLORS[formData.get('ward') as string] || '#7360f2'
    };

    try {
      await setPatients(patientData);
      setShowAddModal(false);
      addAuditLog('CREATE', `Admitted patient: ${patientData.surname}`, 'system');
    } catch (error) {
      console.error("Admission Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Clinical Threads</h2>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center font-bold text-2xl active:scale-95 transition-all"
        >
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-black/20">
        {(['active', 'discharged'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'border-b-4 border-purple-600 text-purple-600' 
                : 'text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar - High Contrast (Point 1/7) */}
      <div className="p-4">
        <input 
          type="text" 
          placeholder="Search patient name..." 
          className="w-full p-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-xl text-sm outline-none dark:text-white font-bold transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 opacity-30 text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Records Found</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="relative group border-b border-gray-50 dark:border-gray-800">
              <button 
                onClick={() => activeTab === 'active' && onSelect(patient.id)} 
                className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                  activeTab === 'active' ? 'hover:bg-purple-50/30 dark:hover:bg-purple-900/10' : 'cursor-default'
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-sm"
                  style={{ backgroundColor: activeTab === 'discharged' ? '#9ca3af' : (WARD_COLORS[patient.ward] || '#7360f2') }}
                >
                  {getInitials(patient.firstName, patient.surname)}
                </div>
                <div className="flex-1 min-w-0 pr-10">
                  <h3 className="truncate text-sm font-black uppercase text-gray-800 dark:text-white">
                    {patient.surname}, {patient.firstName}
                  </h3>
                  <div className="flex gap-2 items-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{patient.ward} • {patient.roomNumber}</p>
                    <span className="text-[9px] bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-500 font-bold uppercase">{patient.sex[0]} • {patient.age}y</span>
                  </div>
                </div>
              </button>
              
              {/* Readmit Button - High Contrast (Point 1) */}
              {activeTab === 'discharged' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm(`Readmit ${patient.surname}?`)) onReadmit(patient.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                >
                  Readmit
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Admission Modal - Restored Age/Sex (Point 3) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase mb-6 dark:text-white tracking-tighter">New Admission</h3>
            <form onSubmit={addNewPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input name="surname" placeholder="SURNAME" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl dark:text-white font-bold text-sm outline-none" />
                <input name="firstName" placeholder="FIRST NAME" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl dark:text-white font-bold text-sm outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <input name="age" type="number" placeholder="AGE" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl dark:text-white font-bold text-sm outline-none" />
                <select name="sex" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl dark:text-white font-bold text-sm outline-none">
                  <option value="">SELECT SEX</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select name="ward" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl dark:text-white font-bold text-sm outline-none">
                  {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input name="roomNumber" placeholder="ROOM #" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl dark:text-white font-bold text-sm outline-none" />
              </div>
              
              <input name="diagnosis" placeholder="PRIMARY DIAGNOSIS" required className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl dark:text-white font-bold text-sm outline-none" />

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
