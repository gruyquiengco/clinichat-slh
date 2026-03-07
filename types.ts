export interface UserProfile {
  id: string;
  firstName: string;
  surname: string;
  middleName?: string;
  prcNumber: string;
  department: 'Surgery' | 'Anesthesia' | 'OB Gyne' | 'Internal Medicine' | 'Adult IDS' | 'Pediatrics' | 'Radiology' | 'Nursing';
  specialty: string;
  email: string;
  phone: string;
  role: 'HCW' | 'SYSCLERK' | 'SYSADMIN';
  photoURL?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE' | 'DISCHARGE' | 'LOGIN';
  targetType: 'PATIENT' | 'USER' | 'MESSAGE';
  targetId: string;
  details: string;
  timestamp: string; // ISO format
}
