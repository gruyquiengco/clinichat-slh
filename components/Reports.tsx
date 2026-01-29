import React, { useState } from 'react';
import { Patient, AuditLog, UserProfile, UserRole } from '../types';

interface ReportsProps {
  patients: Patient[];
  logs: AuditLog[];
  users: UserProfile[];
  currentUser: UserProfile;
  onBack: () => void;
  addAuditLog: (action: any, details: string, targetId: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ patients, logs, users, currentUser, onBack, addAuditLog }) => {
  const [auditStartDate, setAuditStartDate] = useState<string>('');
  const [auditEndDate, setAuditEndDate] = useState<string>('');
  const [censusMonth, setCensusMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const downloadPatientsList = () => {
    const activePatients = patients.filter(p => !p.isArchived);
    if (activePatients.length === 0) {
      alert("No active patients to export.");
      return;
    }
    const headers = ['Patient ID', 'Surname', 'First Name', 'Age', 'Sex', 'Diagnosis', 'Ward', 'Room', 'Date Admitted'];
    const rows = activePatients.map(p => [
      `"${p.patientId}"`, `"${p.surname}"`, `"${p.firstName}"`, p.age, `"${p.sex}"`, 
      `"${p.diagnosis.replace(/"/g, '""')}"`, `"${p.ward}"`, `"${p.roomNumber}"`, `"${p.dateAdmitted}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Active_Census_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('EXPORT', 'Generated Active Patient Census', 'system_bulk');
  };

  const downloadMonthlyActivityReport = () => {
    if (!censusMonth) return alert("Please select a month.");
    const monthlyActivity = patients.filter(p => p.dateAdmitted.startsWith(censusMonth) || p.dateDischarged?.startsWith(censusMonth));
    if (monthlyActivity.length === 0) return alert(`No activity found for ${censusMonth}.`);
    
    const headers = ['Patient ID', 'Surname', 'First Name', 'Status', 'Date Admitted', 'Date Discharged'];
    const rows = monthlyActivity.map(p => {
      const status = p.dateAdmitted.startsWith(censusMonth) && p.dateDischarged?.startsWith(censusMonth) ? 'Admitted & Discharged' : p.dateAdmitted.startsWith(censusMonth) ? 'Newly Admitted' : 'Discharged';
      return [`"${p.patientId}"`, `"${p.surname}"`, `"${p.firstName}"`, `"${status}"`, `"${p.dateAdmitted}"`, `"${p.dateDischarged || 'N/A'}"`];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Movement_${censusMonth}.csv`);
    link.click();
    addAuditLog('EXPORT', `Generated Monthly Report for ${censusMonth}`, 'system_bulk');
  };

  const downloadAuditReport = () => {
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return (auditStartDate ? logDate >= auditStartDate : true) && (auditEndDate ? logDate <= auditEndDate : true);
    });
    if (filteredLogs.length === 0) return alert("No logs found.");

    const headers = ['Timestamp', 'Staff', 'Action', 'Details'];
    const rows = filteredLogs.map(log => {
      const user = users.find(u => u.id === log.userId);
      return [`"${new Date(log.timestamp).toLocaleString()}"`, `"${user ? user.surname : 'Unknown'}"`, `"${log.action}"`, `"${log.details.replace(/"/g, '""')}"` ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    addAuditLog('EXPORT', 'Generated Security Audit Report', 'system_audit');
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex-1 flex flex-col h-full bg-viber-bg dark:bg-viber-dark overflow-hidden">
      {/* HEADER: Cleaned up and removed absolute positioning to prevent clipping */}
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <svg className="w-6 h-6 text-viber-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Systems Reporting</h2>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">Hospital Data Analytics</p>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-24"> {/* Added pb-24 for mobile nav clearance */}
          
          {/* Active Patient Census Section */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Patient Census</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Excel-ready list of current admissions.</p>
                </div>
             </div>
             <button onClick={downloadPatientsList} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download CSV
              </button>
          </div>

          {/* Monthly Movement Section */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-black text-gray-900 dark:text-white uppercase tracking-tight">Patient Movement</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Select month for admission/discharge stats.</p>
                </div>
             </div>
             <input type="month" value={censusMonth} onChange={(e) => setCensusMonth(e.target.value)} className="w-full mb-4 p-4 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none" />
             <button onClick={downloadMonthlyActivityReport} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-emerald-700 transition-all uppercase">
                Generate Movement Report
              </button>
          </div>

          {/* Security Audit Section - ADMIN ONLY */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-purple-100 dark:border-purple-900/30 p-6 shadow-sm">
               <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-md font-black text-gray-900 dark:text-white uppercase tracking-tight">DPA 2012 Audit Trail</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Full database activity logs for compliance.</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="date" value={auditStartDate} onChange={(e) => setAuditStartDate(e.target.value)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs dark:text-white border-none" />
                  <input type="date" value={auditEndDate} onChange={(e) => setAuditEndDate(e.target.value)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs dark:text-white border-none" />
               </div>
               <button onClick={downloadAuditReport} className="w-full bg-viber-purple text-white py-4 rounded-2xl font-black text-xs shadow-lg uppercase">
                 Export Security Log
               </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
               <span className="text-2xl font-black text-blue-600">{patients.filter(p => !p.isArchived).length}</span>
               <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1">Active</p>
             </div>
             <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
               <span className="text-2xl font-black text-emerald-600">{patients.filter(p => p.isArchived).length}</span>
               <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-1">Discharged</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;
