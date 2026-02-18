import React, { useState } from 'react';
import { Patient, UserProfile, Message } from '../types';
import { WARD_OPTIONS, WARD_COLORS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (patient: Patient) => void;
  currentUser: UserProfile;
  setPatients: (patientData: any) => Promise<void>;
}

const PatientList: React.FC<PatientListProps> = ({ 
  patients = [], 
  messages = [],
  onSelect, 
  onReadmit, 
  currentUser,
  setPatients 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');

  const getInitials = (first: string, last: string) => `${first?.[0] || ''}${last?.[0] || ''}`;

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
      age: parseInt(formData.get('age') as string) || 0,
      sex: formData.get('sex') as any,
      diagnosis: formData.get('diagnosis') as string,
      patientId: formData.get('patientId') as string,
      ward: formData.get('ward') as string, 
      roomNumber: formData.get('roomNumber') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      avatarColor: '#7360f2'
    };
    try {
      await setPatients(patientData);
      setShowAddModal(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden border-r border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Clinical Threads</h2>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-purple-600 hover:bg-purple-700 text-white w-10 h-10 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center font-bold text-xl"
        >
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b shrink-0 bg-gray-50/50 dark:bg-black/20">
        <button 
          onClick={() => setActiveTab('active')} 
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'active' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-400'}`}
        >
          Active
        </button>
        <button 
          onClick={() => setActiveTab('discharged')} 
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'discharged' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-400'}`}
        >
          Discharged
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <input 
          type="text" 
          placeholder="Search patient name..." 
          className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-purple-500/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 opacity-40">
            <p className="text-xs font-bold text-gray-400 uppercase">No Records Found</p>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const isMember = patient.members?.includes(currentUser.id);
            const unreadCount = messages.filter(m => 
              m.patientId === patient.id && 
              m.type !== 'system' && 
              !m.readBy?.includes(currentUser.id)
            ).length;

            return (
              <div key={patient.id} className="relative group">
                <button 
                  onClick={() => activeTab === 'active' ? onSelect(patient.id) : null} 
                  className={`w-full flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-800 transition-colors text-left ${patient.isArchived ? 'opacity-70 grayscale-[0.3]' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-105"
                      style={{ 
                        backgroundColor: patient.isArchived ? '#9ca3af' : (WARD_COLORS[patient.ward] || '#7360f2'),
                        color: '#ffffff'
                      }}
                    >
                      {getInitials(patient.firstName, patient.surname)}
                    </div>
                    {isMember && unreadCount > 0 && !patient.isArchived && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white dark:border-gray-900 shadow-sm z-10 px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`truncate text-sm uppercase ${unreadCount > 0 && isMember ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-700 dark:text-gray-300'}`}>
                        {patient.surname}, {patient.firstName}
                      </h3>
                      <span className="text-[9px] font-bold text-gray-400 shrink-0">{patient.dateAdmitted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs truncate text-gray-500 dark:text-gray-400 italic">{patient.diagnosis}</p>
                      <span className="text-[9px] px-2 py-0.5 rounded-md font-black bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                        {patient.ward} • {patient.roomNumber}
                      </span>
                    </div>
                  </div>
                </button>
                
                {activeTab === 'discharged' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(`Readmit ${patient.surname}?`)) onReadmit(patient);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                  >
                    Readmit
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-xl font-black uppercase mb-6 dark:text-white tracking-tighter">New Admission</h3>
            <form onSubmit={addNewPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input name="surname" placeholder="SURNAME" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl dark:text-white font-bold text-sm" />
                <input name="firstName" placeholder="FIRST NAME" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl dark:text-white font-bold text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="ward" className="p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl dark:text-white font-bold text-sm outline-none">
                  {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input name="roomNumber" placeholder="ROOM #" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl dark:text-white font-bold text-sm" />
              </div>
              <input name="diagnosis" placeholder="DIAGNOSIS" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl dark:text-white font-bold text-sm" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-black uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-purple-500/30">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
