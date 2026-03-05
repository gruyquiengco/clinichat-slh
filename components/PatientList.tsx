import React, { useState } from 'react';
import { Patient, UserProfile, Message } from '../types';
import { WARD_OPTIONS, WARD_COLORS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (id: string) => void; // Changed to accept string ID to match App.tsx
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
      ward: formData.get('ward') as string, 
      roomNumber: formData.get('roomNumber') as string,
      diagnosis: formData.get('diagnosis') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      members: [currentUser.id]
    };
    try {
      await setPatients(patientData);
      setShowAddModal(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Clinical Threads</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white w-10 h-10 rounded-xl shadow-lg">+</button>
      </div>

      <div className="flex px-4 border-b shrink-0 bg-gray-50/50 dark:bg-black/20">
        {['active', 'discharged'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4">
        <input 
          type="text" 
          placeholder="Search patient name..." 
          className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm outline-none dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 opacity-40">
            <p className="text-xs font-bold text-gray-400 uppercase">No Records Found</p>
          </div>
        ) : (
          filteredPatients.map(patient => {
            const unreadCount = messages.filter(m => m.patientId === patient.id && !m.readBy?.includes(currentUser.id)).length;

            return (
              <div key={patient.id} className="relative border-b border-gray-50 dark:border-gray-800">
                <button 
                  onClick={() => activeTab === 'active' && onSelect(patient.id)} 
                  className={`w-full flex items-center gap-4 p-4 text-left ${activeTab === 'discharged' ? 'pr-24' : ''}`}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white" style={{ backgroundColor: activeTab === 'discharged' ? '#9ca3af' : (WARD_COLORS[patient.ward] || '#7360f2') }}>
                    {getInitials(patient.firstName, patient.surname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-bold uppercase dark:text-white">{patient.surname}, {patient.firstName}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{patient.ward} • {patient.roomNumber}</p>
                  </div>
                </button>
                
                {activeTab === 'discharged' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(`Readmit ${patient.surname}?`)) onReadmit(patient.id);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase"
                  >
                    Readmit
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Simplified Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6">
            <h3 className="text-xl font-black uppercase mb-4 dark:text-white">New Admission</h3>
            <form onSubmit={addNewPatient} className="space-y-3">
              <input name="surname" placeholder="SURNAME" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm" />
              <input name="firstName" placeholder="FIRST NAME" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm" />
              <select name="ward" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <input name="roomNumber" placeholder="ROOM #" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm" />
              <input name="diagnosis" placeholder="DIAGNOSIS" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm" />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 font-bold text-gray-400">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black">Admit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
