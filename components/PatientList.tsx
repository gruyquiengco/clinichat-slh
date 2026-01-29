import React, { useState } from 'react';
// Verify this path: use '../types' if this file is in a 'components' folder
import { Patient, UserProfile, UserRole, Message } from '../types';
import { WARD_OPTIONS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (patient: Patient) => void;
  currentUser: UserProfile;
  setPatients: (patientData: any) => Promise<void>;
  addAuditLog: (action: any, details: string, targetId: string) => void;
}

const AVATAR_COLORS = ['#7360f2', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#222222'];
const CHAT_BGS = ['#F2F2F7', '#E5E5EA', '#FFF5F5', '#F0FFF4', '#EBF8FF', '#111827'];
type SortOption = 'alphabetical' | 'dateAdmitted' | 'ward' | 'age' | 'roomNumber';

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
  const [sortBy, setSortBy] = useState<SortOption>('dateAdmitted');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedBg, setSelectedBg] = useState(CHAT_BGS[0]);
  const [patientToReadmit, setPatientToReadmit] = useState<Patient | null>(null);

  if (!currentUser) return <div className="p-10 text-center font-bold">Authenticating...</div>;

  const capitalizeName = (str: string) => 
    str ? str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';

  const getInitials = (p: Patient) => 
    `${p.surname?.[0] || ''}${p.firstName?.[0] || ''}`.toUpperCase();

  const formatDateTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) { return ''; }
  };

  const filteredPatients = patients.filter(p => 
    p.isArchived === (activeTab === 'discharged') && 
    (p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical': return (a.surname || '').localeCompare(b.surname || '');
      case 'dateAdmitted': return new Date(b.dateAdmitted || 0).getTime() - new Date(a.dateAdmitted || 0).getTime();
      case 'ward': return (a.ward || '').localeCompare(b.ward || '');
      case 'age': return (a.age || 0) - (b.age || 0);
      case 'roomNumber': return (a.roomNumber || '').localeCompare(b.roomNumber || '');
      default: return 0;
    }
  });

  const addNewPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientData = {
      surname: capitalizeName(formData.get('surname') as string),
      firstName: capitalizeName(formData.get('firstName') as string),
      age: parseInt(formData.get('age') as string) || 0,
      sex: formData.get('sex') as any,
      diagnosis: capitalizeName(formData.get('diagnosis') as string),
      patientId: formData.get('patientId') as string,
      ward: formData.get('ward') as string, 
      roomNumber: formData.get('roomNumber') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      mainHCWId: currentUser.id,
      members: [currentUser.id],
      avatarColor: selectedColor,
      chatBgColor: selectedBg
    };
    try {
      await setPatients(patientData);
      setShowAddModal(false);
    } catch (error) { console.error(error); }
  };

  const canEditClinical = (currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Clinical Threads</h2>
        {canEditClinical && (
          <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'active' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Active</button>
        <button onClick={() => setActiveTab('discharged')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'discharged' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Discharged</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sortedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-xs font-bold uppercase tracking-widest">No Clinical Records Found</p>
          </div>
        ) : (
          sortedPatients.map(patient => {
            const patientMessages = messages.filter(m => m.patientId === patient.id);
            const lastMsg = patientMessages[patientMessages.length - 1];
            return (
              <button key={patient.id} onClick={() => onSelect(patient.id)} className="w-full flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 text-left">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-[11px]" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                  {getInitials(patient)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-bold uppercase text-gray-800 dark:text-white">{patient.surname}, {patient.firstName}</h3>
                    <p className="text-[10px] font-bold text-purple-600 uppercase">{patient.ward}-{patient.roomNumber}</p>
                    <p className="text-xs text-gray-400 truncate italic">{lastMsg?.content || 'Started clinical thread...'}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modals (Ensure you have your Modal code below) */}
      {/* ... Add Patient Modal Code ... */}
    </div>
  );
};

export default PatientList;
