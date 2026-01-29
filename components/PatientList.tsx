import React, { useState } from 'react';
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
  patients = [], // Guard: default to empty array
  messages = [], // Guard: default to empty array
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

  // Safety check: if currentUser is missing, don't render the list logic
  if (!currentUser) return null;

  const capitalizeName = (str: string) => 
    str ? str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';

  const getInitials = (p: Patient) => 
    `${p.surname?.[0] || ''}${p.firstName?.[0] || ''}`.toUpperCase();

  const formatDateTime = (ts: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
      });
    } catch (e) { return ''; }
  };

  // Filter with null checks
  const filteredPatients = (patients || []).filter(p => {
    const isArchiveMatch = p.isArchived === (activeTab === 'discharged');
    const matchesSearch = 
      p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    return isArchiveMatch && matchesSearch;
  });

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

      {/* Search & Sort */}
      <div className="p-4 space-y-3 shrink-0">
        <div className="relative">
          <input type="text" placeholder="Search by name or ID..." className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort:</span>
          <select className="bg-gray-100 dark:bg-gray-800 dark:text-gray-300 text-[10px] font-bold py-1 px-3 rounded-full border-none outline-none uppercase" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="alphabetical">Surname</option>
            <option value="dateAdmitted">Admission</option>
            <option value="ward">Ward</option>
            <option value="age">Age</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {sortedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
          </div>
        ) : (
          sortedPatients.map(patient => {
            const patientMessages = (messages || []).filter(m => m.patientId === patient.id && m.type !== 'system');
            const lastMsg = patientMessages[patientMessages.length - 1];
            const unreadCount = patientMessages.filter(m => !(m.readBy || []).includes(currentUser.id)).length;
            
            return (
              <button key={patient.id} onClick={() => onSelect(patient.id)} className="w-full flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all text-left">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-[11px] shadow-sm" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                    {getInitials(patient)}
                  </div>
                  {unreadCount > 0 && !patient.isArchived && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white dark:border-gray-900 shadow-sm">
                      {unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`truncate text-sm uppercase tracking-tight ${unreadCount > 0 ? 'font-black text-black dark:text-white' : 'font-bold text-gray-700 dark:text-gray-200'}`}>
                      {patient.surname}, {patient.firstName}
                    </h3>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                      {lastMsg ? formatDateTime(lastMsg.timestamp) : (patient.isArchived ? `D: ${patient.dateDischarged}` : `A: ${patient.dateAdmitted}`)}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter mb-1">
                    {patient.ward}-{patient.roomNumber} • {patient.diagnosis}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate italic">
                    {lastMsg?.content || 'No clinical entries yet...'}
                  </p>
                </div>

                {patient.isArchived && canEditClinical && (
                  <div onClick={(e) => { e.stopPropagation(); setPatientToReadmit(patient); }} className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                    Readmit
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Modals remain same as your logic... */}
      {/* [ADD PATIENT MODAL AND READMIT MODAL CODE FROM YOUR FILE] */}
    </div>
  );
};

export default PatientList;
